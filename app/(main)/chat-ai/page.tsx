
"use client";

import { FileUploadResponseProps } from "@/app/(main)/image-ai/page";
import Markdown from "@/components/Markdown";
import RIghtSide from "@/components/RIghtSide";
import { Models } from "@/constant";
import { GoogleGenAI, createPartFromUri, createUserContent } from "@google/genai";
import { AudioLines, Bot, Check, Copy, FileText, FolderOpen, ImagePlus, Loader2, Menu, MessageSquareText, Mic, MoreHorizontal, PanelLeftClose, PanelLeftOpen, PenLine, Plus, Send, Sparkles, Square, Trash2, User, X } from "lucide-react";
import Image from "next/image";
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";

type ChatRole = "user" | "assistant";
type ReferenceKind = "image" | "pdf" | "file";

interface ReferenceAttachment extends FileUploadResponseProps {
  id: string;
  kind: ReferenceKind;
  fileName: string;
}

interface ChatMessage {
  id: string;
  role: ChatRole;
  message: string;
  loading?: boolean;
  references: ReferenceAttachment[] | null;
}

interface Conversation {
  id: string;
  title: string;
  summary: string[];
  messages: ChatMessage[];
}

interface ContextMenuState {
  open: boolean;
  conversationIndex: number;
  clientX: number;
  clientY: number;
}

const ai = new GoogleGenAI({ apiKey: process.env.NEXT_PUBLIC_GOOGLE_GEMINA_API });

const makeId = () => `${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

const createConversation = (title = "New chat", messages?: ChatMessage[]): Conversation => ({
  id: makeId(),
  title,
  summary: [],
  messages: messages ?? [],
});

const starterPrompts = [
  "Summarize this topic in simple steps",
  "Help me write a strong product description",
  "Review my idea and suggest improvements",
  "Explain this concept with examples",
];

const getReferenceKind = (mimeType?: string): ReferenceKind => {
  if (mimeType?.startsWith("image/")) return "image";
  if (mimeType === "application/pdf") return "pdf";
  return "file";
};

type ConversationContextValue = {
  conversations: Conversation[];
  setConversations: React.Dispatch<React.SetStateAction<Conversation[]>>;
  activeTab: number;
  setActiveTab: React.Dispatch<React.SetStateAction<number>>;
};

const STORAGE_KEY = "gemina_chat_conversations_v1";
const LIBRARY_KEY = "gemina_file_library_v1";

/** Serialisable subset of ReferenceAttachment — blob/previewUrl are never persisted */
interface SavedFileRef {
  id: string;
  kind: ReferenceKind;
  fileName: string;
  name?: string;
  displayName?: string;
  mimeType?: string;
  sizeBytes?: string;
  createTime?: string;
  uri?: string;
  downloadUri?: string;
}
// context provider
const ConversationContext = React.createContext<ConversationContextValue>({} as any);

const ConversationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // loading intial conversation
  const [conversations, setConversations] = React.useState<Conversation[]>(() => {
    try {
      if (typeof window === "undefined") return [createConversation()];
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return [createConversation()];
      const parsed = JSON.parse(raw) as Conversation[];
      console.log({ parsed });
      if (Array.isArray(parsed) && parsed.length) return parsed;
    } catch (e) {
      // ignore
    }

    return [createConversation()];
  });

  const [activeTab, setActiveTab] = React.useState<number>(() => {
    try {
      if (typeof window === "undefined") return 0;
      const raw = localStorage.getItem(`${STORAGE_KEY}_activeTab`);
      if (!raw) return 0;
      const n = parseInt(raw, 10);
      return Number.isNaN(n) ? 0 : n;
    } catch (e) {
      return 0;
    }
  });

  React.useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(conversations));
    } catch (e) {
      // ignore
    }
  }, [conversations]);

  React.useEffect(() => {
    try {
      localStorage.setItem(`${STORAGE_KEY}_activeTab`, String(activeTab));
    } catch (e) {
      // ignore
    }
  }, [activeTab]);

  return (
    <ConversationContext.Provider value={{ conversations, setConversations, activeTab, setActiveTab }}>
      {children}
    </ConversationContext.Provider>
  );
};

function Page() {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const contextMenuRef = useRef<HTMLDivElement>(null);
  const previewUrlsRef = useRef<string[]>([]);
  const assistantCopyTimeoutRef = useRef<number | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  const [sidebarOpen, setSidebarOpen] = useState(true);
  const { conversations, setConversations, activeTab, setActiveTab } = React.useContext(ConversationContext);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [uploadLoading, setUploadLoading] = useState(false);
  const [audioProcessing, setAudioProcessing] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [prompt, setPrompt] = useState("");
  const [copiedAssistantId, setCopiedAssistantId] = useState<string | null>(null);
  const [selectedModel, setSelectedModel] = useState("Gemini 2.5 Flash");
  const [modelPickerOpen, setModelPickerOpen] = useState(false);
  const [micError, setMicError] = useState<string | null>(null);
  const [renameState, setRenameState] = useState<{ index: number | null; text: string }>({
    index: null,
    text: "",
  });
  const [contextMenu, setContextMenu] = useState<ContextMenuState>({
    open: false,
    conversationIndex: -1,
    clientX: 0,
    clientY: 0,
  });
  const [uploadedReferences, setUploadedReferences] = useState<ReferenceAttachment[]>([]);

  // ── File Library ────────────────────────────────────────────────────────────
  const [fileLibrary, setFileLibrary] = useState<SavedFileRef[]>(() => {
    try {
      if (typeof window === "undefined") return [];
      const raw = localStorage.getItem(LIBRARY_KEY);
      if (!raw) return [];
      const parsed = JSON.parse(raw) as SavedFileRef[];
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  });
  const [libraryPickerOpen, setLibraryPickerOpen] = useState(false);
  const [selectedLibraryIds, setSelectedLibraryIds] = useState<Set<string>>(new Set());
  // ────────────────────────────────────────────────────────────────────────────

  const activeConversation = conversations[activeTab] ?? conversations[0];
  const selectedModelMeta = useMemo(
    () => Models.find((item) => item.name === selectedModel) ?? Models[0],
    [selectedModel]
  );

  const selectedModelValue = useMemo(() => {
    const matchedModel = Models.find((item) => item.name === selectedModel);
    return matchedModel?.value ?? Models[0]?.value ?? "gemini-2.5-flash";
  }, [selectedModel]);

  useEffect(() => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    textarea.style.height = "auto";
    textarea.style.height = `${Math.min(textarea.scrollHeight, 220)}px`;
  }, [prompt]);

  useEffect(() => {
    const scroller = scrollAreaRef.current;
    if (!scroller) return;

    scroller.scrollTo({
      top: scroller.scrollHeight,
      behavior: "smooth",
    });
  }, [activeTab, conversations, submitLoading]);

  useEffect(() => {
    const handleOutsideClick = (event: MouseEvent) => {
      if (contextMenuRef.current?.contains(event.target as Node)) return;
      setContextMenu((prev) => ({ ...prev, open: false }));
    };

    if (contextMenu.open) {
      document.addEventListener("mousedown", handleOutsideClick);
    }

    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
    };
  }, [contextMenu.open]);

  useEffect(() => {
    const handleOutsideClick = (event: MouseEvent) => {
      const target = event.target as HTMLElement | null;
      if (target?.closest("[data-model-picker-root]")) return;
      setModelPickerOpen(false);
    };

    if (modelPickerOpen) {
      document.addEventListener("mousedown", handleOutsideClick);
    }

    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
    };
  }, [modelPickerOpen]);

  useEffect(() => {
    const handleOutsideClick = (event: MouseEvent) => {
      const target = event.target as HTMLElement | null;
      if (target?.closest("[data-library-picker-root]")) return;
      setLibraryPickerOpen(false);
    };

    if (libraryPickerOpen) {
      document.addEventListener("mousedown", handleOutsideClick);
    }

    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
    };
  }, [libraryPickerOpen]);

  // Persist file library to localStorage whenever it changes
  useEffect(() => {
    try {
      localStorage.setItem(LIBRARY_KEY, JSON.stringify(fileLibrary));
    } catch {
      // ignore
    }
  }, [fileLibrary]);

  useEffect(() => {
    const previewUrls = previewUrlsRef.current;
    return () => {
      previewUrls.forEach((url) => URL.revokeObjectURL(url));
      if (assistantCopyTimeoutRef.current) {
        window.clearTimeout(assistantCopyTimeoutRef.current);
      }
      mediaRecorderRef.current?.stop();
      mediaStreamRef.current?.getTracks().forEach((track) => track.stop());
    };
  }, []);

  const setPromptText = (value: string) => {
    setPrompt(value);
  };

  const resetUpload = () => {
    setUploadedReferences([]);

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleImageUpload = async (files: FileList | null) => {
    if (!files?.length) return;

    try {
      setUploadLoading(true);
      const nextReferences: ReferenceAttachment[] = [];

      for (const file of Array.from(files)) {
        const buffer = await file.arrayBuffer();
        const blob = new Blob([buffer], { type: file.type });
        const previewUrl = file.type.startsWith("image/") ? URL.createObjectURL(blob) : "";
        if (previewUrl) {
          previewUrlsRef.current.push(previewUrl);
        }

        const uploaded = await ai.files.upload({
          file: blob,
          config: {
            mimeType: file.type,
          },
        });

        const refId = makeId();
        nextReferences.push({
          ...uploaded,
          id: refId,
          kind: getReferenceKind(file.type),
          fileName: file.name,
          mimeType: uploaded.mimeType || file.type,
          displayName: uploaded.displayName || file.name,
          previewUrl,
          blob,
        });

        // ── Persist to File Library (blob & previewUrl intentionally omitted) ──
        const savedRef: SavedFileRef = {
          id: refId,
          kind: getReferenceKind(file.type),
          fileName: file.name,
          name: uploaded.name,
          displayName: uploaded.displayName || file.name,
          mimeType: uploaded.mimeType || file.type,
          sizeBytes: uploaded.sizeBytes,
          createTime: uploaded.createTime,
          uri: uploaded.uri,
          downloadUri: uploaded.downloadUri,
        };
        setFileLibrary((prev) => {
          // Avoid duplicate if same uri already exists in the library
          if (prev.some((item) => item.uri && item.uri === savedRef.uri)) return prev;
          return [...prev, savedRef];
        });
      }

      setUploadedReferences((prev) => [...prev, ...nextReferences]);
    } catch (error) {
      console.error("Image upload failed", error);
      resetUpload();
    } finally {
      setUploadLoading(false);
    }
  };

  const transcribeRecordedAudio = async (audioBlob: Blob) => {
    setAudioProcessing(true);
    setMicError(null);

    try {
      const uploadedAudio = await ai.files.upload({
        file: audioBlob,
        config: {
          mimeType: audioBlob.type || "audio/webm",
        },
      });

      const response = await ai.models.generateContent({
        // Official Gemini audio docs verify this path for audio understanding.
        // Gemma 4 was requested, but Google does not currently document a hosted
        // Gemma audio transcription path here, so this uses the documented model.
        model: "gemini-2.5-flash",
        contents: createUserContent([
          createPartFromUri(uploadedAudio.uri ?? "", uploadedAudio.mimeType || audioBlob.type || "audio/webm"),
          "Transcribe this audio to plain text only. Do not add explanation, labels, timestamps, or formatting. Return only the spoken words.",
        ]),
      });

      const transcript = response.text?.trim();
      if (!transcript) {
        setMicError("No speech was detected in the recording.");
        return;
      }

      setPrompt((prev) => (prev.trim() ? `${prev.trim()} ${transcript}` : transcript));
    } catch (error) {
      console.error("Audio transcription failed", error);
      setMicError("Unable to process the recording right now.");
    } finally {
      setAudioProcessing(false);
    }
  };

  const stopMediaStream = () => {
    mediaStreamRef.current?.getTracks().forEach((track) => track.stop());
    mediaStreamRef.current = null;
  };

  const stopRecording = () => {
    const recorder = mediaRecorderRef.current;
    if (!recorder) return;

    if (recorder.state !== "inactive") {
      recorder.stop();
    }

    setIsRecording(false);
  };

  const startRecording = async () => {
    if (!navigator.mediaDevices?.getUserMedia) {
      setMicError("Microphone recording is not supported in this browser.");
      return;
    }

    try {
      setMicError(null);
      // it is going to get the permission of media like audio or video based of the config
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaStreamRef.current = stream;
      audioChunksRef.current = [];

      const mimeType = MediaRecorder.isTypeSupported("audio/webm;codecs=opus")
        ? "audio/webm;codecs=opus"
        : "audio/webm";

      const recorder = new MediaRecorder(stream, { mimeType });
      mediaRecorderRef.current = recorder;

      recorder.addEventListener("dataavailable", (event) => {
        console.log("Event",event);
        
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      });

      recorder.addEventListener("stop", async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: recorder.mimeType || "audio/webm" });
        audioChunksRef.current = [];
        stopMediaStream();

        if (audioBlob.size > 0) {
          await transcribeRecordedAudio(audioBlob);
        } else {
          setMicError("The recording was empty.");
        }
      });

      recorder.start();
      setIsRecording(true);
    } catch (error) {
      console.error("Microphone access denied", error);
      setMicError("Microphone permission is required to record audio.");
      stopMediaStream();
    }
  };

  const toggleRecording = async () => {
    if (isRecording) {
      stopRecording();
      return;
    }
    await startRecording();
  };

  const removeReference = (referenceId: string) => {
    setUploadedReferences((prev) => prev.filter((item) => item.id !== referenceId));
  };

  // ── Library helpers ──────────────────────────────────────────────────────────
  const toggleLibrarySelection = (id: string) => {
    setSelectedLibraryIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const attachFromLibrary = () => {
    const toAttach = fileLibrary
      .filter((ref) => selectedLibraryIds.has(ref.id))
      .map<ReferenceAttachment>((ref) => ({
        id: ref.id,
        kind: ref.kind,
        fileName: ref.fileName,
        name: ref.name,
        displayName: ref.displayName,
        mimeType: ref.mimeType,
        sizeBytes: ref.sizeBytes,
        createTime: ref.createTime,
        uri: ref.uri,
        downloadUri: ref.downloadUri,
        previewUrl: undefined,
        blob: undefined,
        isChecked: true,
      }));

    if (toAttach.length === 0) return;

    setUploadedReferences((prev) => {
      const existingIds = new Set(prev.map((r) => r.id));
      return [...prev, ...toAttach.filter((r) => !existingIds.has(r.id))];
    });
    setSelectedLibraryIds(new Set());
    setLibraryPickerOpen(false);
  };

  const clearLibrary = () => {
    setFileLibrary([]);
    setSelectedLibraryIds(new Set());
    try {
      localStorage.removeItem(LIBRARY_KEY);
    } catch {
      // ignore
    }
  };
  // ────────────────────────────────────────────────────────────────────────────

  const openContextMenu = (event: React.MouseEvent, conversationIndex: number) => {
    event.stopPropagation();
    setContextMenu({
      open: true,
      conversationIndex,
      clientX: event.clientX,
      clientY: event.clientY,
    });
  };

  const createNewConversation = () => {
    const nextConversation = createConversation(`New chat ${conversations.length + 1}`);
    setConversations((prev) => [nextConversation, ...prev]);
    setActiveTab(0);
    setRenameState({ index: null, text: "" });
    setPrompt("");
    resetUpload();
  };

  const deleteConversation = (conversationIndex: number) => {
    setConversations((prev) => {
      const next = prev.filter((_, index) => index !== conversationIndex);
      if (next.length === 0) {
        setActiveTab(0);
        return [createConversation()];
      }

      if (conversationIndex === activeTab) {
        setActiveTab(Math.max(0, conversationIndex - 1));
      } else if (conversationIndex < activeTab) {
        setActiveTab((prevActive) => Math.max(0, prevActive - 1));
      }

      return next;
    });

    setContextMenu((prev) => ({ ...prev, open: false }));
  };

  const startRenameConversation = (conversationIndex: number) => {
    setRenameState({
      index: conversationIndex,
      text: conversations[conversationIndex]?.title ?? "",
    });
    setContextMenu((prev) => ({ ...prev, open: false }));
  };

  const saveRenameConversation = () => {
    if (renameState.index === null) return;

    setConversations((prev) =>
      prev.map((conversation, index) =>
        index === renameState.index
          ? {
            ...conversation,
            title: renameState.text.trim() || conversation.title,
          }
          : conversation
      )
    );

    setRenameState({ index: null, text: "" });
  };

  const updateConversationTitleFromPrompt = (conversationIndex: number, text: string) => {
    const nextTitle = text.trim().slice(0, 38) || "New chat";
    setConversations((prev) =>
      prev.map((conversation, index) => {
        if (index !== conversationIndex) return conversation;
        if (!conversation.title.toLowerCase().startsWith("new chat")) return conversation;

        return {
          ...conversation,
          title: nextTitle,
        };
      })
    );
  };

  const sendMessage = async () => {
    const trimmedPrompt = prompt.trim();
    if (!trimmedPrompt || submitLoading || !activeConversation) return;

    const conversationIndex = activeTab;
    const messageReferences = uploadedReferences.length ? uploadedReferences : null;
    console.log({ messageReferences });
    const userMessage: ChatMessage = {
      id: makeId(),
      role: "user",
      message: trimmedPrompt,
      references: messageReferences,
    };
    const assistantMessage: ChatMessage = {
      id: makeId(),
      role: "assistant",
      message: "",
      loading: true,
      references: null,
    };

    console.log({ userMessage, assistantMessage, conversations, conversationIndex, activeTab });
    const summaryData = conversations.find((v, i) => i === activeTab)
    console.log({ summaryData });

    setSubmitLoading(true);
    setConversations((prev) =>
      prev.map((conversation, index) =>
        index === conversationIndex
          ? {
            ...conversation,
            messages: [...conversation.messages, userMessage, assistantMessage],
          }
          : conversation
      )
    );
    updateConversationTitleFromPrompt(conversationIndex, trimmedPrompt);
    setPrompt("");


    // 1. Format the history for the LLM
    // We map your local ChatMessage structure to the LLM's expected structure
    const history = conversations[activeTab].messages.slice(-5)?.map((msg) => ({
      role:  msg.role === 'user' ? 'user' : 'model',
      parts: [{ text: msg.message }]
    })) ?? [];
    console.log({history});
    

    try {
      const contentParts = [
        ...(messageReferences ?? [])
          .filter((reference) => reference.uri && reference.mimeType)
          .map((reference) => createPartFromUri(reference.uri as string, reference.mimeType as string)),
        trimmedPrompt,
      ];
      console.log({ contentParts });
      const content = createUserContent(contentParts);
      console.log({ content, history });

      const response = await ai.models.generateContentStream({
        model: selectedModelValue,
        contents: [...history, content],
      });

      let streamTextChunk = ""

      for await (const chunk of response) {
        const streamedText = chunk.candidates?.[0]?.content?.parts?.[0]?.text;
        if (!streamedText) continue;
        streamTextChunk += streamedText
        setConversations((prev) =>
          prev.map((conversation, index) => {
            if (index !== conversationIndex) return conversation;

            return {
              ...conversation,
              messages: conversation.messages.map((message, messageIndex, allMessages) => {
                if (messageIndex !== allMessages.length - 1) return message;
                if (message.role !== "assistant") return message;

                return {
                  ...message,
                  message: `${message.message}${streamedText}`,
                  loading: false,
                };
              }),
            };
          })
        );
      }
      // llmResponseStyle(streamTextChunk);

    } catch (error) {
      console.error("Error in sendMessage:", error);
      setConversations((prev) =>
        prev.map((conversation, index) => {
          if (index !== conversationIndex) return conversation;

          return {
            ...conversation,
            messages: conversation.messages.map((message, messageIndex, allMessages) => {
              if (messageIndex !== allMessages.length - 1) return message;
              if (message.role !== "assistant") return message;

              return {
                ...message,
                message: "Something went wrong while generating the response. Please try again.",
                loading: false,
              };
            }),
          };
        })
      );

      console.log({ conversations });

    } finally {
      setSubmitLoading(false);
      resetUpload();
    }
  };

  const llmResponseStyle = useCallback(async (llmInput: string) => {
    if (!llmInput) return;
    console.log("going to summary");

    const combinedPrompt = `Return brief summary my current markdown content:${llmInput}`;
    const payload = { prompt: combinedPrompt, model: "gemma-4-31b-it", system: "" };

    try {
      const res = await fetch('/api/gemini/stream', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const text = await res.text().catch(() => null);
        throw new Error(`Request failed: ${res.status} ${text || ''}`);
      }

      try {
        const json = await res.json();
        const summaryText = json.raw.candidates[0].content.parts[1].text;
        console.log({ summaryText });

        setConversations((prev) =>
          prev.map((conversation, index) => {
            if (index !== activeTab) return conversation;

            return {
              ...conversation,
              summary: [...conversation.summary, summaryText]
            };
          })
        );
      } catch {
        const text = await res.text();
        return text
      }
    } catch {
      throw new Error(`Request failed:`);
    }
  }, []);

  const handleComposerKeyDown = (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      sendMessage();
    }
  };

  const copyAssistantMessage = async (messageId: string, messageText: string) => {
    try {
      await navigator.clipboard.writeText(messageText);
      setCopiedAssistantId(messageId);

      if (assistantCopyTimeoutRef.current) {
        window.clearTimeout(assistantCopyTimeoutRef.current);
      }

      assistantCopyTimeoutRef.current = window.setTimeout(() => {
        setCopiedAssistantId(null);
      }, 1800);
    } catch (error) {
      console.error("Failed to copy assistant message", error);
    }
  };

  const renderReferenceCard = (
    reference: ReferenceAttachment,
    options?: {
      removable?: boolean;
      onRemove?: (referenceId: string) => void;
      compact?: boolean;
    }
  ) => {
    const compact = options?.compact ?? false;

    return (
      <div
        key={reference.id}
        className={`relative rounded-2xl border border-white/10 bg-white/[0.05] ${compact ? "p-2" : "p-3"}`}
      >
        <div className="flex items-center gap-3">
          {reference.kind === "image" && reference.previewUrl ? (
            <Image
              src={reference.previewUrl}
              alt={reference.displayName || reference.fileName}
              width={compact ? 44 : 56}
              height={compact ? 44 : 56}
              className={`${compact ? "h-11 w-11" : "h-14 w-14"} rounded-2xl object-cover`}
            />
          ) : (
            <div
              className={`inline-flex ${compact ? "h-11 w-11" : "h-14 w-14"} items-center justify-center rounded-2xl ${reference.kind === "pdf" ? "bg-red-500/15 text-red-200" : "bg-white/[0.08] text-white/70"}`}
            >
              <FileText size={compact ? 18 : 22} />
            </div>
          )}

          <div className="min-w-0 flex-1">
            <div className="line-clamp-1 text-sm font-semibold text-white">
              {reference.displayName || reference.fileName}
            </div>
            <div className="text-xs uppercase tracking-[0.2em] text-white/45">
              {reference.kind === "image" ? "Image reference" : reference.kind === "pdf" ? "PDF reference" : "File reference"}
            </div>
          </div>
        </div>

        {options?.removable && options.onRemove && (
          <button
            type="button"
            onClick={() => options.onRemove?.(reference.id)}
            className="absolute right-2 top-2 inline-flex h-8 w-8 items-center justify-center rounded-xl border border-white/10 bg-[#09131f] text-white/65 transition hover:bg-white/[0.08]"
            aria-label={`Remove ${reference.displayName || reference.fileName}`}
          >
            <X size={14} />
          </button>
        )}
      </div>
    );
  };

  const deleteLibraryReference = async (referenceId: string) => {
    try {
      setFileLibrary((prev) => prev.filter((reference) => reference.id !== referenceId));
    } catch (error) {
      console.error("Failed to delete library reference", error);
    }
  }


  return (
    <main className="h-[calc(100vh)] overflow-hidden bg-[#06111b] text-white">
      <div className="relative flex h-full overflow-hidden bg-[radial-gradient(circle_at_top_left,rgba(56,189,248,0.16),transparent_28%),radial-gradient(circle_at_top_right,rgba(16,185,129,0.12),transparent_24%),linear-gradient(180deg,#08111d_0%,#06111b_100%)]">
        <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.025)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:34px_34px] opacity-25" />

        <aside
          className={`absolute inset-y-0 left-0 z-30 w-[min(88vw,320px)] border-r border-white/10 bg-[#081422]/95 backdrop-blur-xl transition-transform duration-300 lg:relative lg:translate-x-0 ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}`}
        >
          <div className="flex h-full min-h-0 flex-col">
            <div className="border-b border-white/10 px-4 py-4">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <div className="text-xs font-semibold uppercase tracking-[0.28em] text-cyan-200/60">
                    Workspace
                  </div>
                  <h1 className="mt-2 text-2xl font-black text-white">Chat AI</h1>
                </div>
                <button
                  type="button"
                  onClick={() => setSidebarOpen(false)}
                  className="inline-flex h-10 w-10 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.04] text-white/70 transition hover:bg-white/[0.08] lg:hidden"
                  aria-label="Close sidebar"
                >
                  <PanelLeftClose size={18} />
                </button>
              </div>

              <button
                type="button"
                onClick={createNewConversation}
                className="mt-5 flex w-full items-center justify-center gap-2 rounded-2xl border border-cyan-300/20 bg-cyan-400/12 px-4 py-3 text-sm font-semibold text-cyan-50 transition hover:bg-cyan-400/20"
              >
                <Plus size={16} />
                New conversation
              </button>
            </div>

            <div className="historyScrollbar min-h-0 flex-1 space-y-2 overflow-y-auto px-3 py-4">
              {conversations.map((conversation, index) => {
                const isActive = index === activeTab;
                const isRenaming = renameState.index === index;

                return (
                  <button
                    key={conversation.id}
                    type="button"
                    onClick={() => {
                      setActiveTab(index);
                      setSidebarOpen(false);
                    }}
                    className={`group w-full rounded-2xl border px-3 py-3 text-left transition ${isActive ? "border-cyan-300/30 bg-cyan-400/12 shadow-[0_0_0_1px_rgba(34,211,238,0.08)]" : "border-white/6 bg-white/[0.03] hover:bg-white/[0.06]"}`}
                  >
                    <div className="flex items-start gap-3">
                      <div className={`mt-0.5 inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl ${isActive ? "bg-cyan-400/15 text-cyan-100" : "bg-white/[0.05] text-white/65"}`}>
                        <MessageSquareText size={16} />
                      </div>

                      <div className="min-w-0 flex-1">
                        {isRenaming ? (
                          <input
                            autoFocus
                            value={renameState.text}
                            onChange={(event) =>
                              setRenameState((prev) => ({ ...prev, text: event.target.value }))
                            }
                            onBlur={saveRenameConversation}
                            onKeyDown={(event) => {
                              if (event.key === "Enter") {
                                event.preventDefault();
                                saveRenameConversation();
                              }
                            }}
                            className="w-full rounded-xl border border-white/10 bg-[#0a1a2a] px-3 py-2 text-sm font-semibold text-white outline-none transition focus:border-cyan-300/40"
                          />
                        ) : (
                          <>
                            <div className="line-clamp-1 text-sm font-semibold text-white">
                              {conversation.title}
                            </div>
                            <div className="mt-1 line-clamp-2 text-xs leading-5 text-white/45">
                              {conversation.messages[conversation.messages.length - 1]?.message ||
                                "Start a new conversation"}
                            </div>
                          </>
                        )}
                      </div>

                      {!isRenaming && (
                        <span
                          onClick={(event) => openContextMenu(event, index)}
                          className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-xl text-white/40 opacity-0 transition hover:bg-white/[0.08] hover:text-white/80 group-hover:opacity-100"
                        >
                          <MoreHorizontal size={16} />
                        </span>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </aside>

        <section className="relative z-10 flex min-w-0 flex-1 flex-col overflow-hidden">
          <header className="border-b border-white/10 bg-[#07111b]/80 px-4 py-4 backdrop-blur-xl lg:px-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setSidebarOpen((prev) => !prev)}
                  className="inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.04] text-white/80 transition hover:bg-white/[0.08]"
                  aria-label="Toggle sidebar"
                >
                  {sidebarOpen ? <PanelLeftClose size={18} /> : <PanelLeftOpen size={18} />}
                </button>

                <div>
                  <div className="text-xs font-semibold uppercase tracking-[0.26em] text-cyan-200/55">
                    Conversation
                  </div>
                  <h2 className="mt-1 text-xl font-black text-white">
                    {activeConversation?.title ?? "New chat"}
                  </h2>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <span className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-2 text-xs font-semibold text-white/65">
                  {selectedModel}
                </span>
                <span className="rounded-full border border-emerald-300/15 bg-emerald-400/10 px-3 py-2 text-xs font-semibold text-emerald-100">
                  Multi-modal ready
                </span>
              </div>
            </div>
          </header>

          <div className="flex min-h-0 flex-1 overflow-hidden">
            <div className="flex min-w-0 min-h-0 flex-1 flex-col overflow-hidden">
              <div ref={scrollAreaRef} className="historyScrollbar min-h-0 flex-1 overflow-y-auto px-4 pb-40 pt-6 lg:px-8">
                {activeConversation?.messages.length ? (
                  <div className="mx-auto flex w-full max-w-4xl flex-col gap-6">
                    {activeConversation.messages.map((message) => (
                      <div
                        key={message.id}
                        className={`flex gap-4 ${message.role === "user" ? "justify-end" : "justify-start"}`}
                      >
                        {message.role === "assistant" && (
                          <div className="hidden h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-cyan-300/15 bg-cyan-400/10 text-cyan-100 md:inline-flex">
                            <Bot size={18} />
                          </div>
                        )}

                        <div
                          className={`max-w-[min(100%,48rem)] rounded-[28px] border p-4 md:p-5 ${message.role === "user" ? "border-white/10 bg-white/[0.08] text-white shadow-[0_12px_40px_rgba(0,0,0,0.16)]" : "border-cyan-300/10 bg-[#0a1826]/90 shadow-[0_16px_48px_rgba(0,0,0,0.22)]"}`}
                        >
                          <div className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.24em]">
                            <span className={message.role === "user" ? "text-white/55" : "text-cyan-200/65"}>
                              {message.role === "user" ? "You" : "Assistant"}
                            </span>
                            {message.loading && <Loader2 size={14} className="animate-spin text-cyan-200/80" />}
                          </div>

                          {message.role === "assistant" ? (
                            message.loading && !message.message ? (
                              <div className="flex items-center gap-2 text-sm text-white/55">
                                <Loader2 size={16} className="animate-spin" />
                                Thinking...
                              </div>
                            ) : (
                              <div className="space-y-3">
                                <Markdown text={message.message} runCopy={submitLoading} />

                                {message.message ? (
                                  <div className="flex justify-end">
                                    <button
                                      type="button"
                                      onClick={() => copyAssistantMessage(message.id, message.message)}
                                      className={`inline-flex items-center gap-2 rounded-2xl border px-3 py-2 text-xs font-semibold transition ${copiedAssistantId === message.id
                                        ? "border-emerald-300/20 bg-emerald-400/15 text-emerald-100"
                                        : "border-white/10 bg-white/[0.04] text-white/70 hover:bg-white/[0.08] hover:text-white"
                                        }`}
                                      aria-label="Copy assistant response"
                                    >
                                      {copiedAssistantId === message.id ? (
                                        <Check size={14} />
                                      ) : (
                                        <Copy size={14} />
                                      )}
                                      {copiedAssistantId === message.id ? "Copied" : "Copy response"}
                                    </button>
                                  </div>
                                ) : null}
                              </div>
                            )
                          ) : (
                            <div className="space-y-3">
                              {message.references?.length ? (
                                <div className="grid gap-2 sm:grid-cols-2">
                                  {message.references.map((reference) =>
                                    renderReferenceCard(reference, { compact: true })
                                  )}
                                </div>
                              ) : null}

                              <p className="whitespace-pre-wrap text-sm leading-7 text-white/90 md:text-[15px]">
                                {message.message}
                              </p>
                            </div>
                          )}
                        </div>

                        {message.role === "user" && (
                          <div className="hidden h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.06] text-white/80 md:inline-flex">
                            <User size={18} />
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="mx-auto flex h-full w-full max-w-4xl flex-col items-center justify-center py-16 text-center">
                    <div className="inline-flex h-20 w-20 items-center justify-center rounded-[28px] border border-cyan-300/15 bg-cyan-400/10 text-cyan-100 shadow-[0_20px_70px_rgba(34,211,238,0.12)]">
                      <Sparkles size={30} />
                    </div>
                    <h3 className="mt-6 text-3xl font-black text-white">Start a smarter conversation</h3>
                    <p className="mt-3 max-w-2xl text-sm leading-7 text-white/60 md:text-base">
                      Ask for writing help, analysis, coding, brainstorming, or image-aware prompts. The layout is designed to feel closer to modern AI workspaces, with a calmer reading area and a focused composer.
                    </p>

                    <div className="mt-8 grid w-full gap-3 md:grid-cols-2">
                      {starterPrompts.map((item) => (
                        <button
                          key={item}
                          type="button"
                          onClick={() => setPromptText(item)}
                          className="rounded-3xl border border-white/10 bg-white/[0.04] px-5 py-4 text-left text-sm text-white/80 transition hover:-translate-y-0.5 hover:bg-white/[0.07]"
                        >
                          {item}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div className="sticky bottom-0 border-t border-white/10 bg-[#07111b]/95 px-4 py-4 backdrop-blur-xl lg:px-8">
                <div className="mx-auto w-full max-w-4xl">
                  <div className="rounded-[30px] border border-white/10 bg-[#0a1826]/95 p-3 shadow-[0_28px_70px_rgba(0,0,0,0.32)]">
                    {uploadedReferences.length ? (
                      <div className="mb-3 space-y-3">
                        <div className="flex items-center justify-between gap-3">
                          <div className="text-sm font-semibold text-white">
                            Attached references
                          </div>
                          <button
                            type="button"
                            onClick={resetUpload}
                            className="rounded-2xl border border-white/10 bg-white/[0.04] px-3 py-2 text-xs font-semibold text-white/65 transition hover:bg-white/[0.08]"
                          >
                            Clear all
                          </button>
                        </div>

                        <div className="grid gap-3 sm:grid-cols-2">
                          {uploadedReferences.map((reference) =>
                            renderReferenceCard(reference, {
                              removable: true,
                              onRemove: removeReference,
                            })
                          )}
                        </div>
                      </div>
                    ) : null}

                    <textarea
                      ref={textareaRef}
                      value={prompt}
                      onChange={(event) => setPromptText(event.target.value)}
                      onKeyDown={handleComposerKeyDown}
                      placeholder="Message the assistant..."
                      className="max-h-[220px] min-h-[74px] w-full resize-none bg-transparent px-2 py-2 text-sm leading-7 text-white outline-none placeholder:text-white/35 md:text-[15px]"
                    />

                    {isRecording || audioProcessing || micError ? (
                      <div className="mt-2 flex flex-wrap items-center gap-2 px-2">
                        {isRecording ? (
                          <div className="inline-flex items-center gap-2 rounded-full border border-red-300/20 bg-red-400/12 px-3 py-1.5 text-xs font-semibold text-red-100">
                            <span className="inline-flex h-2.5 w-2.5 animate-pulse rounded-full bg-red-300" />
                            Recording...
                          </div>
                        ) : null}

                        {audioProcessing ? (
                          <div className="inline-flex items-center gap-2 rounded-full border border-cyan-300/20 bg-cyan-400/12 px-3 py-1.5 text-xs font-semibold text-cyan-100">
                            <AudioLines size={14} className="animate-pulse" />
                            Processing voice to text...
                          </div>
                        ) : null}

                        {micError ? (
                          <div className="rounded-full border border-amber-300/20 bg-amber-400/12 px-3 py-1.5 text-xs font-semibold text-amber-100">
                            {micError}
                          </div>
                        ) : null}
                      </div>
                    ) : null}

                    <div className="mt-3 flex flex-col gap-3 border-t border-white/10 pt-3 lg:flex-row lg:items-center lg:justify-between">
                      <div className="flex flex-wrap items-center gap-2">
                        <label className="inline-flex cursor-pointer items-center gap-2 rounded-2xl border border-white/10 bg-white/[0.04] px-3 py-2 text-sm font-medium text-white/75 transition hover:bg-white/[0.08]">
                          <ImagePlus size={16} />
                          {uploadLoading ? "Uploading..." : "Add image"}
                          <input
                            ref={fileInputRef}
                            type="file"
                            accept="image/*,.pdf,application/pdf"
                            multiple
                            className="hidden"
                            onChange={(event) => handleImageUpload(event.target.files)}
                          />
                        </label>

                        {/* ── File Library Picker ─────────────────────────────── */}
                        <div className="relative" data-library-picker-root>
                          <button
                            type="button"
                            id="library-picker-btn"
                            onClick={() => {
                              setSelectedLibraryIds(new Set());
                              setLibraryPickerOpen((prev) => !prev);
                            }}
                            className="inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-white/[0.04] px-3 py-2 text-sm font-medium text-white/75 transition hover:bg-white/[0.08]"
                            aria-label="Open file library"
                          >
                            <FolderOpen size={16} />
                            Library
                            {fileLibrary.length > 0 && (
                              <span className="inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-cyan-400/20 px-1.5 text-[11px] font-bold text-cyan-200">
                                {fileLibrary.length}
                              </span>
                            )}
                          </button>

                          {libraryPickerOpen && (
                            <div className="absolute bottom-[calc(100%+12px)] left-0 z-40 w-[min(92vw,360px)] overflow-hidden rounded-[26px] border border-white/10 bg-[#081422]/98 shadow-[0_22px_60px_rgba(0,0,0,0.4)] backdrop-blur-xl">
                              {/* Header */}
                              <div className="flex items-center justify-between border-b border-white/10 px-4 py-3">
                                <div>
                                  <div className="text-xs font-semibold uppercase tracking-[0.24em] text-cyan-200/60">
                                    File Library
                                  </div>
                                  <div className="mt-0.5 text-sm text-white/55">
                                    {fileLibrary.length === 0
                                      ? "No saved references yet"
                                      : `${fileLibrary.length} saved reference${fileLibrary.length !== 1 ? "s" : ""}`}
                                  </div>
                                </div>
                                <button
                                  type="button"
                                  onClick={() => setLibraryPickerOpen(false)}
                                  className="inline-flex h-8 w-8 items-center justify-center rounded-xl border border-white/10 bg-white/[0.04] text-white/50 transition hover:bg-white/[0.08]"
                                  aria-label="Close library panel"
                                >
                                  <X size={14} />
                                </button>
                              </div>

                              {/* Empty state */}
                              {fileLibrary.length === 0 ? (
                                <div className="flex flex-col items-center justify-center gap-3 px-4 py-10 text-center">
                                  <div className="inline-flex h-14 w-14 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.04] text-white/30">
                                    <FolderOpen size={24} />
                                  </div>
                                  <p className="text-sm text-white/40">
                                    Upload files via &ldquo;Add image&rdquo; — they&apos;ll be saved here for reuse across sessions.
                                  </p>
                                </div>
                              ) : (
                                <div className="historyScrollbar max-h-[280px] space-y-1.5 overflow-y-auto p-2">
                                  {fileLibrary.map((ref) => {
                                    const isSelected = selectedLibraryIds.has(ref.id);
                                    const uploadDate = ref.createTime
                                      ? new Date(ref.createTime).toLocaleDateString(undefined, {
                                        month: "short",
                                        day: "numeric",
                                      })
                                      : null;

                                    return (
                                      <button
                                        key={ref.id}
                                        type="button"
                                        id={`library-ref-${ref.id}`}
                                        onClick={() => toggleLibrarySelection(ref.id)}
                                        className={`flex w-full items-center gap-3 rounded-2xl border px-3 py-2.5 text-left transition ${isSelected
                                          ? "border-cyan-300/30 bg-cyan-400/12"
                                          : "border-white/6 bg-white/[0.03] hover:bg-white/[0.06]"
                                          }`}
                                      >
                                        {/* Checkbox indicator */}
                                        <div
                                          className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-md border transition ${isSelected
                                            ? "border-cyan-300/50 bg-cyan-400/20 text-cyan-100"
                                            : "border-white/20 bg-white/[0.04]"
                                            }`}
                                        >
                                          {isSelected && <Check size={12} />}
                                        </div>

                                        {/* File type icon */}
                                        <div
                                          className={`inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${ref.kind === "image"
                                            ? "bg-cyan-400/12 text-cyan-200"
                                            : ref.kind === "pdf"
                                              ? "bg-red-500/12 text-red-200"
                                              : "bg-white/[0.06] text-white/60"
                                            }`}
                                        >
                                          <FileText size={16} />
                                        </div>

                                        <span className="cursor-pointer absolute right-2 top-1 hover:text-red-500 bg-red-500/12 rounded-full p-1" onClick={(e) => {
                                          e.stopPropagation(); deleteLibraryReference(ref.id)
                                        }}><Trash2 size={16} /></span>

                                        {/* Name + meta */}
                                        <div className="min-w-0 flex-1">
                                          <div className="line-clamp-1 text-sm font-semibold text-white">
                                            {ref.displayName || ref.fileName}
                                          </div>
                                          <div className="flex items-center gap-1.5 text-[11px] uppercase tracking-[0.16em] text-white/40">
                                            <span>
                                              {ref.kind === "image" ? "Image" : ref.kind === "pdf" ? "PDF" : "File"}
                                            </span>
                                            {uploadDate && (
                                              <>
                                                <span className="h-1 w-1 rounded-full bg-white/20" />
                                                <span>{uploadDate}</span>
                                              </>
                                            )}
                                          </div>
                                        </div>
                                      </button>
                                    );
                                  })}
                                </div>
                              )}

                              {/* Footer actions */}
                              {fileLibrary.length > 0 && (
                                <div className="flex items-center justify-between gap-2 border-t border-white/10 px-3 py-3">
                                  <button
                                    type="button"
                                    onClick={clearLibrary}
                                    className="rounded-2xl border border-red-300/15 bg-red-400/8 px-3 py-2 text-xs font-semibold text-red-200/80 transition hover:bg-red-400/15"
                                  >
                                    Clear library
                                  </button>
                                  <button
                                    type="button"
                                    onClick={attachFromLibrary}
                                    disabled={selectedLibraryIds.size === 0}
                                    className="rounded-2xl border border-cyan-300/25 bg-cyan-400/15 px-4 py-2 text-xs font-semibold text-cyan-50 transition hover:bg-cyan-400/25 disabled:cursor-not-allowed disabled:opacity-40"
                                  >
                                    Attach selected
                                    {selectedLibraryIds.size > 0 ? ` (${selectedLibraryIds.size})` : ""}
                                  </button>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                        {/* ─────────────────────────────────────────────────────── */}

                        <div className="relative" data-model-picker-root>
                          <button
                            type="button"
                            onClick={() => setModelPickerOpen((prev) => !prev)}
                            className="flex min-w-[220px] items-center justify-between gap-3 rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-2.5 text-left transition hover:bg-white/[0.08]"
                            aria-label="Choose model"
                          >
                            <div className="min-w-0">
                              <div className="line-clamp-1 text-sm font-semibold text-white/85">
                                {selectedModelMeta?.name ?? selectedModel}
                              </div>
                              <div className="mt-1 flex items-center gap-2 text-[11px] uppercase tracking-[0.18em] text-white/40">
                                <span>{selectedModelMeta?.family ?? "Model"}</span>
                                <span className={`rounded-full px-2 py-0.5 tracking-normal ${selectedModelMeta?.free ? "bg-emerald-400/12 text-emerald-100" : "bg-amber-400/12 text-amber-100"}`}>
                                  {selectedModelMeta?.free ? "Free" : "Paid"}
                                </span>
                              </div>
                            </div>
                            <Menu className={`shrink-0 text-white/40 transition ${modelPickerOpen ? "rotate-90" : ""}`} size={16} />
                          </button>

                          {modelPickerOpen ? (
                            <div className="absolute bottom-[calc(100%+12px)] left-0 z-40 w-[min(92vw,320px)] overflow-hidden rounded-[26px] border border-white/10 bg-[#081422]/98 p-2 shadow-[0_22px_60px_rgba(0,0,0,0.4)] backdrop-blur-xl">
                              <div className="border-b border-white/10 px-3 py-3">
                                <div className="text-xs font-semibold uppercase tracking-[0.24em] text-cyan-200/60">
                                  Models
                                </div>
                                <div className="mt-1 text-sm text-white/55">
                                  Pick the model family and pricing tier that fits your task.
                                </div>
                              </div>

                              <div className="historyScrollbar max-h-[320px] space-y-2 overflow-y-auto p-2">
                                {Models.map((model) => {
                                  const active = model.name === selectedModel;

                                  return (
                                    <button
                                      key={model.value}
                                      type="button"
                                      onClick={() => {
                                        setSelectedModel(model.name);
                                        setModelPickerOpen(false);
                                      }}
                                      className={`w-full rounded-2xl border px-3 py-3 text-left transition ${active
                                        ? "border-cyan-300/25 bg-cyan-400/12"
                                        : "border-white/6 bg-white/[0.03] hover:bg-white/[0.06]"
                                        }`}
                                    >
                                      <div className="flex items-start justify-between gap-3">
                                        <div className="min-w-0">
                                          <div className="line-clamp-1 text-sm font-semibold text-white">
                                            {model.name}
                                          </div>
                                          <div className="mt-1 text-xs text-white/45">
                                            {model.family} • {model.type}
                                          </div>
                                        </div>

                                        <div className="flex shrink-0 items-center gap-2">
                                          <span
                                            className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${model.free
                                              ? "bg-emerald-400/12 text-emerald-100"
                                              : "bg-amber-400/12 text-amber-100"
                                              }`}
                                          >
                                            {model.free ? "Free" : "Paid"}
                                          </span>
                                          {active ? (
                                            <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-cyan-400/14 text-cyan-100">
                                              <Check size={14} />
                                            </span>
                                          ) : null}
                                        </div>
                                      </div>
                                    </button>
                                  );
                                })}
                              </div>
                            </div>
                          ) : null}
                        </div>

                        <button
                          type="button"
                          onClick={toggleRecording}
                          disabled={audioProcessing}
                          className={`inline-flex items-center gap-2 rounded-2xl border px-3 py-2 text-sm font-medium transition ${isRecording
                            ? "border-red-300/20 bg-red-400/12 text-red-100 hover:bg-red-400/18"
                            : "border-white/10 bg-white/[0.04] text-white/75 hover:bg-white/[0.08]"
                            } disabled:cursor-not-allowed disabled:opacity-50`}
                          aria-label={isRecording ? "Stop recording" : "Start microphone recording"}
                        >
                          {isRecording ? <Square size={16} /> : <Mic size={16} />}
                          {isRecording ? "Stop" : audioProcessing ? "Processing..." : "Mic"}
                        </button>
                      </div>

                      <div className="flex items-center justify-between gap-3">
                        <span className="text-xs text-white/40">
                          Press `Enter` to send, `Shift + Enter` for a new line
                        </span>
                        <button
                          type="button"
                          onClick={sendMessage}
                          disabled={submitLoading || !prompt.trim()}
                          className="inline-flex h-12 min-w-12 items-center justify-center rounded-2xl border border-cyan-300/25 bg-cyan-400/15 px-4 text-cyan-50 transition hover:bg-cyan-400/25 disabled:cursor-not-allowed disabled:opacity-45"
                          aria-label="Send message"
                        >
                          {submitLoading ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <RIghtSide />

          </div>
        </section>

        {contextMenu.open &&
          typeof document !== "undefined" &&
          createPortal(
            <div
              ref={contextMenuRef}
              className="fixed z-[90] min-w-[180px] rounded-2xl border border-white/10 bg-[#091827] p-2 text-white shadow-[0_20px_60px_rgba(0,0,0,0.35)]"
              style={{
                left: Math.min(contextMenu.clientX, window.innerWidth - 220),
                top: Math.min(contextMenu.clientY, window.innerHeight - 120),
              }}
            >
              <button
                type="button"
                onClick={() => startRenameConversation(contextMenu.conversationIndex)}
                className="flex w-full items-center gap-3 rounded-xl px-3 py-2 text-left text-sm text-white/80 transition hover:bg-white/[0.08]"
              >
                <PenLine size={16} />
                Rename
              </button>
              <button
                type="button"
                onClick={() => deleteConversation(contextMenu.conversationIndex)}
                className="flex w-full items-center gap-3 rounded-xl px-3 py-2 text-left text-sm text-red-300 transition hover:bg-red-500/10"
              >
                <Trash2 size={16} />
                Delete
              </button>
            </div>,
            document.body
          )}
      </div>
    </main>
  );
}

export default function PageWrapper() {
  return (
    <ConversationProvider>
      <Page />
    </ConversationProvider>
  );
}
