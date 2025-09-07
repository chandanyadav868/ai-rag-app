
// ye funtion use await , es ka matlab hai ki jab tak generateVideos ko response return nhi karta hai tab tak ye wait karega, ai ek objectet hai jiske pass models naam ka property hai , us models naam ke property ke pass ek methods hai jiska naam generateVideos hai jo ki ek object leta hai with following keys model, propmt, generateVideos ek Promise return karta hai, yes promise microQueue mai jata hai, 
// let operation = await ai.models.generateVideos({
//     model: "veo-3.0-generate-preview",
//     prompt: prompt,
// });

// operation jo ki ek promise hai , us ke under hum done promty ko dekhate hai ki kya wo true hai , kyuki hum negative exclaimationm use kiya hai jo ki true ko false aur falsly ko true kar deta hai , es samy operation ek promise hai to done ki value to hogi hi nhi to value will be true, 
// us ke bad ye while scope ke under jata hai, wha par log karta hai, ek nya Promise banata jata hai us ko 10s, setTimeOut jo ki task Queue mai chala jata hai, us ke pass resolve hota hai 10s second ke bad reolve call back run hota hai, aur promise se baahar aa jate hai, us ke bad uper declare value operation ki value ko change karta hai, kyuki operation ko not keep in heep memor, 
// ai jo ki ek object hai us ke pass ek keys operations hai aur opertions ke pass ek methods hai jiska naam getVideoOperations hai jo ki ek object leta hai us object mai aap operation key ko upar declared kiye gye opertion variable holding promise diya jata hai, esa lagata hai ye getVideoOperaton google ke backend ko call karta hai by extraction something from operation valriable and wait till we get response from google ai , jo response getVideoOperation deta hai us ko operation ke under fit kar dita jata hai , aur operaton ki jo pahale se value hold kar rha that vo garbage collector dawara discard kar diya jata jai kyuki ab use koi hold nhi kar rha hai, ye loop jab tak chalta hai jab tak opertions ke under ek done naam ka property nhi aa jati aur value true nhi ho jata
// while (!operation.done) {
//     console.log("Waiting for video generation to complete...")
//     await new Promise((resolve) => setTimeout(resolve, 10000));
//     operation = await ai.operations.getVideosOperation({
//         operation: operation,
//     });
// }















// // mujhe esa lagata hai use strict ka use this ki value ko manage karne ke liye kiya gya hai, 
// 'use strict';

// // ye methods Object ka pahel parameter mai, use dala jata hai jis object ke under property dalani hai, dura parameter hai property ka naam , tisara paramerter hai uski value kya hogi, leking hum to exports._esModule = true bhi to kar sakate the to kyu nhi kiya , explain goes with Object methods
// Object.defineProperty(exports, '__esModule', { value: true });

// // humne crypto ko crypto variable mai hold kar liya hai, ab sare methods jo crypto library ke pass that wo crypto variable mai aa gya hai
// var crypto = require('crypto');

// // ye funtion declaration ek paramter leta hai but ye confusing lag rha hai kyu ye pahle return e kar rha hai aur and operator ke satch bad mai check kar rhai hai , kya sabhi condition ko check karne ke bad e return hoga ya pahle
// // ye function check kar rha hai ki ky bheja gya parameter object hai ya nhi, ydi hai to yes , phir aage jata hai kya e jo ki object hoga ke under default naam ka property hai ya nhi, ydi hai to e rahne to otherwise aap ek object banao us ke undder default naam ka property rho aur uska value jo parameter bheja hai use rkho
// function _interopDefaultLegacy (e) { return e && typeof e === 'object' && 'default' in e ? e : { 'default': e }; }

// // ye calling funtion give argument whole crypto and hold the return value in the crypro_default , why i am checking , first condition is that default key will not present or it can be other except object, give me reason
// var crypto__default = /*#__PURE__*/_interopDefaultLegacy(crypto);

// // this is the timing funtion 1 minutes 60s and then multiply by 30 give 30 second
// const DEFAULT_TIME_DIFF = 60 * 30; // 30 minutes
// /**
//  * This function generates the authentication parameters required for uploading files to ImageKit.
//  * It is intended to be used on the server-side only.
//  *
//  * @param {GenerateAuthOptions} options - The options for generating the authentication parameters.
//  * @param {string} options.privateKey - The private key for your ImageKit account.
//  * @param {string} options.publicKey - The public key for your ImageKit account.
//  * @param {string} [options.token] - An optional token. If not provided, a new UUID will be generated.
//  * @param {number} [options.expire] - An optional expiration time in seconds. If not provided, it defaults to 30 minutes from the current time.
//  * @returns {AuthResponse} - The authentication parameters including token, signature, and expiration time.
//  */

// // this is the main funtion for which all things done 
// const getUploadAuthParams = function ({
//   token,
//   expire,
//   publicKey,
//   privateKey
// }) {
//   // Optional: add a runtime check so that if the function ever runs on the client, it fails early.
//   if (typeof window !== "undefined") {
//     throw new Error("getUploadAuthParams is a server-side only function.");
//   }
//   // user ne privateKey aur publicKey diya hai or nhi
//   if (!privateKey || !publicKey) {
//     throw new Error("privateKey and publicKey are required");
//   }
//   // Date.now() methods 1 jan 1970 se ab tak kitne millisecond huya hai deta hai , jab 1000 se divide karte hai to ye second mai return karta hai , Math.floor decimal wali sankhaya ko uski small integer mai badl deta hai, aur uske under 30 minutes ke second ko jod deta hai
//   const defaultExpire = Math.floor(Date.now() / 1000) + DEFAULT_TIME_DIFF;
//   // authResponse ek object hold karta hai with token and expire property, token key ke undar ydi user ne token diya hai to use fit kar lo, crypto_defaut ki keys default ko select kro unke under randomUUID ko run kro aur return value ko token ke under phit kar do , expire ydi diya hai to use rkho warna humne banaya hai use rkho, leking user ko Math.floor(Date.now() / 1000) + DEFAULT_TIME_DIFF es trike se dena hoga, 
//   const authResponse = {
//     token: token || crypto__default["default"].randomUUID(),
//     expire: expire || defaultExpire
//   };

//   // phir se default key ki value ko lo aur us mai se createHmac ko run karo, with sha1 string and privateKey given by user, jo aaye us ke pass update ho use update ko call kiya jayega with jo humne authResponse ke under token phit kiya tha and string mai convert kar expire jo ki ek Number tha , un ko run karne ke bad jo return hoga us ke pass digest naam ka method hoga us ko string hex pass kiya jayega 
//   const signature = crypto__default["default"].createHmac("sha1", privateKey).update(authResponse.token + String(authResponse.expire)).digest("hex");
//   // aur last mai ek object return karuga with three keys 
//   return {
//     expire: Number(authResponse.expire),
//     token: authResponse.token,
//     signature
//   };
// };

// hum expire aur token aur signature bhej rhe hai , jab ye server par jayega to to wo bhi same HAMC ka use karke jaise maine kiya hai wase hi karke verify karega aur match karega ki dono same hai ya nhi

// // exports jo ki object hai es ke under _esmodules value true maujud hai , es ke under getUploadAuthParams naam ka keys mai getUploadAuthParams phit kar ke bhej diya gya hai
// exports.getUploadAuthParams = getUploadAuthParams;
// //# sourceMappingURL=index.js.map



// import crypto from "crypto";

// const token = crypto.randomUUID();
// console.log(token)

// const hmac = crypto.createHmac("sha1","chandanyadav").update(token);

// const digest = hmac.digest("hex");
// console.log(digest);
















// // maine ek OwnSignal naam ka constructer banaya hai
// class OwnSignal {
//     // constuctor run karta hai jab bhi OwnSignal ki copy banae jayegi, this is {} empty object hai uske under _abort, _reason, _onabort naam ka property jiski value corresponding value hogi by default
//     constructor(){
//        this._aborted = false;
//        this._reason = undefined;
//        this._onaborted = null
//     }

//     // _abort ek methods hai jisko bina parenthesis ke bulaya jata hai, ye ek property return karta hai es class ke under se _abort ki value
//     get aborted(){
//        return this._aborted
//     }

//     // ye bhi above methods ki tarah hai
//     get onaborted(){
//         return this._onaborted
//     }

//     // ye methods apke this object ke _aborted property mai value ko change kar deta hai with given value, ye set ek value leta hai 
//     set abort(value){
//         this._aborted = value
//     }

//     // ye bhi upar wale ki tarh hai
//     set onabort(value){
//         this._onabort = value
//     }

//     // ye funtion apne scope ke under check karta hai ki kya this jo ki object hai us ke pass maujud _abort ki value true ho jati , to ye ek error throw karta hai jaha par catch funtion maujut hoga with calling a new class of Error which will take if user given reason if not the AbortError will go
//     throwIfAbort(){
//         if (this._aborted) {
//             throw new Error(this._reason || "AbortError")
//         }
//     }
// }

// // maine ek class banae hai jiska naam OwnAbortSignal hai,
// class OwnAbortSignal {
//     // jab bhi es class ka blueprint banaya jayega to this jo ki ek empty object hai us ke under signal naam ka property banega us ke under OwnSignal ke sare methods maujud hoge with proprty and method we can also use access them like signal.
//     constructor(){
//        this._signal = new OwnSignal()
//     }

//     // ye methods signal ko property ko return jiske pass sare methods maujud hai, ko return kate hai
//     get signal(){
//         return this._signal
//     }

//     // abort ek methods hai jo ki OwnAbortSignal mai likha gya hai ye ek parameter accept kata hai jo , aur eska block scope code _signal ki value ko access karke eske _aborted property ki value ko change karta hai ja ki OwnSignal ki value hai, aur reason bhi esa hi hai
//     abort (reason){
//         this._signal._aborted = true
//         this._signal._reason = reason
//     }

// }

// const abort = new OwnAbortSignal();
// console.log(abort)

// abort.abort("Error ho gya")

// console.log(abort.signal)






















// // // Call the ImageKit SDK upload function with the required parameters and callbacks.
// //         try {
// //             const uploadResponse = await upload({
// //                 // Authentication parameters
// //                 expire,
// //                 token,
// //                 signature,
// //                 publicKey,
// //                 file,
// //                 fileName: file.name, // Optionally set a custom file name
// //                 // Progress callback to update upload progress state
// //                 onProgress: (event) => {
// //                     setProgress((event.loaded / event.total) * 100);
// //                 },
// //                 // Abort signal to allow cancellation of the upload if needed.
// //                 abortSignal: abortController.signal,
// //             });
// //             console.log("Upload response:", uploadResponse);
// //         } catch (error) {
// //             // Handle specific error types provided by the ImageKit SDK.
// //             if (error instanceof ImageKitAbortError) {
// //                 console.error("Upload aborted:", error.reason);
// //             } else if (error instanceof ImageKitInvalidRequestError) {
// //                 console.error("Invalid request:", error.message);
// //             } else if (error instanceof ImageKitUploadNetworkError) {
// //                 console.error("Network error:", error.message);
// //             } else if (error instanceof ImageKitServerError) {
// //                 console.error("Server error:", error.message);
// //             } else {
// //                 // Handle any other errors that may occur.
// //                 console.error("Upload error:", error);
// //             }
// //         }




// // upload ek function hai which holding a call back and that callback have parameter uploadOptions
// const upload = uploadOptions => {
//     // agar uploadOptions ke pass null or undefined hai to aap promise ko turant reject kar dijiye jaha par catch method likha hai us ke pass error parameter main new ImageKit Invalid message dikha do ki options invalid hai aap ne kuchh bhi nhi bheja hai
//     if (!uploadOptions) {
//         return Promise.reject(new ImageKitInvalidRequestError("Invalid options provided for upload"));
//     }
//     // ye Promise apane argument jo ki callback hai with two parameter which are really function hai, es callback ke block mai bahut code likha hai wo sab chalega
//     return new Promise((resolve, reject) => {
//         // uploadOptions ke under se xhr naam ka property nikal lo aur uska naam userProvideXHR rakh do , if user given its own xhr configuration
//         const {
//             xhr: userProvidedXHR
//         } = uploadOptions || {};
//         // aap uploadOptions ke under se .xhr ko delete kar do kyuki userProvideXHR ke pass value aa ge hai
//         delete uploadOptions.xhr;
//         // agar user ne apana xhr diya hai to uska use kar otherwise apana khud ka new XMLHttpRequest banao
//         const xhr = userProvidedXHR || new XMLHttpRequest();
//         if (!uploadOptions.file) {
//             return reject(new ImageKitInvalidRequestError(errorMessages.MISSING_UPLOAD_FILE_PARAMETER.message));
//         }
//         if (!uploadOptions.fileName) {
//             return reject(new ImageKitInvalidRequestError(errorMessages.MISSING_UPLOAD_FILENAME_PARAMETER.message));
//         }
//         if (!uploadOptions.publicKey || uploadOptions.publicKey.length === 0) {
//             return reject(new ImageKitInvalidRequestError(errorMessages.MISSING_PUBLIC_KEY.message));
//         }
//         if (!uploadOptions.token) {
//             return reject(new ImageKitInvalidRequestError(errorMessages.MISSING_TOKEN.message));
//         }
//         if (!uploadOptions.signature) {
//             return reject(new ImageKitInvalidRequestError(errorMessages.MISSING_SIGNATURE.message));
//         }
//         if (!uploadOptions.expire) {
//             return reject(new ImageKitInvalidRequestError(errorMessages.MISSING_EXPIRE.message));
//         }

//         // upar hamne sare important things check kar liya hai , ydi un mai se koe nhi hai to reject ho jayega,
//         // ab check hoga ki kya user ne transformation naam ki property bheji hai or nhi, if user ne bheja hai to ab if block chalega
//         if (uploadOptions.transformation) {
//             // tranformation es lagta hai ki wo object hoga us ke pass bahut keys hogi un keys ko Array mai convert kiya gya hai with the help of Object Keys, pata lagao ki kya array of keys include karta hai pre nam ka value, if true hai to false kar do , if false hai to agale conditon checking ke pass jao, if post samil hota hai to ek error bheja jaye ga, pre bhejo lekin post mat bhejo
//             if (!(Object.keys(uploadOptions.transformation).includes("pre") || Object.keys(uploadOptions.transformation).includes("post"))) {
//                 return reject(new ImageKitInvalidRequestError(errorMessages.INVALID_TRANSFORMATION.message));
//             }
//             // kya pre hai false aur pre true, then it will not run , ye aur upar wala esa lagata hai do pure ke pur opposite hai , upar dono check kar rhai hai ki kahi maine pre aur post to key ke rup mai to nhi di diya hai 
//             if (Object.keys(uploadOptions.transformation).includes("pre") && !uploadOptions.transformation.pre) {
//                 return reject(new ImageKitInvalidRequestError(errorMessages.INVALID_PRE_TRANSFORMATION.message));
//             }
//             // agar post hai to ye wala chalega block code
//             if (Object.keys(uploadOptions.transformation).includes("post")) {
//             // agar tranformation ke under post key ek Array ko hold karta hai to eska block chalega
//                 if (Array.isArray(uploadOptions.transformation.post)) {
//                     // post ek array hai to for of loop chalayege
//                     for (let transformation of uploadOptions.transformation.post) {
//                         // transformation post array ki har index ki value ko tranformation de put karega, transformation ke pass bhi object hai hum check karege ki type key ki value abs hai aur tranformation ke pass protocol or value ki value unddefined hai yadi esa hota hai to reject ho jaye ga kyuki dono true ho jayege
//                         if (transformation.type === "abs" && !(transformation.protocol || transformation.value)) {
//                             return reject(new ImageKitInvalidRequestError(errorMessages.INVALID_POST_TRANSFORMATION.message));
//                         } // agar upar wale mai koe bhi false ho jata hai to else if chalega, es mai dekha jayega ki tranformation ke type ke pass value tranformation hai kya , aur tranformation ki value ke pass koe value nhi hai, to reject ho jayega
//                         else if (transformation.type === "transformation" && !transformation.value) {
//                             return reject(new ImageKitInvalidRequestError(errorMessages.INVALID_POST_TRANSFORMATION.message));
//                         }
//                     }
//                 } // lekin post tranforamtion mai aur wo ek array nhi hai to else ka error chalega 
//                 else {
//                     return reject(new ImageKitInvalidRequestError(errorMessages.INVALID_POST_TRANSFORMATION.message));
//                 }
//             }
//         }

//         // hum ek formData Object banate hai, ye ek parakar se class object hai jiske pass methods hai jo file ke dwara bheja gya data ko ek jagah put kar ta hai, ye ek built in file handling class object hai, esa nhi hai ki aap nhi bana sakate ho,
//         var formData = new FormData();
//         // ek variable declare kiya gya hai
//         let key;
//         // upload jo ki ek object hai ki upar in wala loop chalega aur key ke pass property naam maujud hoga
//         for (key in uploadOptions) {
//             // agar key ke kichh hai like string if ka block chalega
//             if (key) {
//                 // kya key string file hai, aur uploadOptions.file jo ki file ka data hold karta hai fileIinput.file[0] ki value ko diya gaya hai, file ke under , kya wo string to nhi hai if yes then formData ke pass set naam ka methods hai jo ki key file leta hai uski value uploaded.file leta hai aur file name in third arguemnt
//                 if (key === "file" && typeof uploadOptions.file != "string") {
//                     formData.set('file', uploadOptions.file, String(uploadOptions.fileName));
//                 } // key tags hai aur tags ek array hona chahiye if yes, then formData make keys tags and keep all tags array value as string by joing it from , commans 
//                 else if (key === "tags" && Array.isArray(uploadOptions.tags)) {
//                     formData.set('tags', uploadOptions.tags.join(","));
//                 } // same 
//                 else if (key === 'signature') {
//                     formData.set("signature", uploadOptions.signature);
//                 } // same
//                 else if (key === 'expire') {
//                     formData.set("expire", String(uploadOptions.expire));
//                 } else if (key === 'token') {
//                     formData.set("token", uploadOptions.token);
//                 } else if (key === "responseFields" && Array.isArray(uploadOptions.responseFields)) {
//                     formData.set('responseFields', uploadOptions.responseFields.join(","));
//                 } else if (key === "extensions" && Array.isArray(uploadOptions.extensions)) {
//                     formData.set('extensions', JSON.stringify(uploadOptions.extensions));
//                 } else if (key === "customMetadata" && typeof uploadOptions.customMetadata === "object" && !Array.isArray(uploadOptions.customMetadata) && uploadOptions.customMetadata !== null) {
//                     formData.set('customMetadata', JSON.stringify(uploadOptions.customMetadata));
//                 } else if (key === "transformation" && typeof uploadOptions.transformation === "object" && uploadOptions.transformation !== null) {
//                     formData.set(key, JSON.stringify(uploadOptions.transformation));
//                 } else if (key === 'checks' && uploadOptions.checks) {
//                     formData.set("checks", uploadOptions.checks);
//                 } // last agar aur keys bheja jata hai to dekho ki kya uski value undefined to nhi hai, if nhi hai to , block chalao , yes onPropgess or abortSignal naam se bheja gya hai property ke naam se the continue kar do matlab next property suru kar do , agar koi aur hai to us key se uski value ko set kar do
//                 else if (uploadOptions[key] !== undefined) {
//                     if (["onProgress", "abortSignal"].includes(key)) continue;
//                     formData.set(key, String(uploadOptions[key]));
//                 }
//             }
//         }
//         // agar user ne onProgess naam ka key bheja hai to xhr ke upload property mai onProgess property banao aur us ke under funtion ko attach kar do wo function user dwara beha gya funtion run karta hai by passing event jo ki onprogress dega jab bhi chalega, 
//         // main to callback bhi use kar sakata tha , leking funtion key kyu use kiya ha or es ka koe matlab nhi hai aap callback bhi use kar sakte ho 
//         // aur mujhe batao ki upoadOption.OnProgess run karta hai callback wo callback setProgress methods run karta hai , to ye funtion kis environtment mai run karta hai , kya wo react mai chlega ya js mai chalega, aur kis parkar se 
//         if (uploadOptions.onProgress) {
//             xhr.upload.onprogress = function (event) {
//                 if (uploadOptions.onProgress) uploadOptions.onProgress(event);
//             };
//         }
//         // onAbortHandler ek function hai 
//         function onAbortHandler() {
//             // ye ek __uploadOptions$abortS variable declare kiya gya hai
//             var _uploadOptions$abortS;
//             // xhr jiske pass abort function hoga us ko run kar do
//             xhr.abort();
//             // aur return kar jo reject chalake for error in catch block, 
//             return reject(new ImageKitAbortError("Upload aborted", (_uploadOptions$abortS = uploadOptions.abortSignal) === null || _uploadOptions$abortS === void 0 ? void 0 : _uploadOptions$abortS.reason));
//         }
//         // check kar ki abortSignal ke pass value hai ya nhi, jaisa pta hai abortSignal ek object hai 
//         if (uploadOptions.abortSignal) {
//             // abortSignal ke pass ek property hoti hai jiska naam aborted hota jo ki intialised par false hota hai , agar kisi ne abort button click kiya hai to abort true to jata hai, agar true hai to abort ho jaye ga
//             if (uploadOptions.abortSignal.aborted) {
//                 // _uploadOptions$abortS2 ek declare variable hai 
//                 var _uploadOptions$abortS2;

//                 return reject(new ImageKitAbortError("Upload aborted", (_uploadOptions$abortS2 = uploadOptions.abortSignal) === null || _uploadOptions$abortS2 === void 0 ? void 0 : _uploadOptions$abortS2.reason));
//             }
//             // agar true nhi hai to intial time par to , ye wala method chalega, aapke aborSignal ke pass ye features hai ki aap event laga sakate ho, abort addEventListener ko ek methods attach kar diya gya hai jo upar banaya gya hai
//             uploadOptions.abortSignal.addEventListener("abort", onAbortHandler);
//             // xhr ke pass bhi event Attach karne ki liye methods hota hai, loadend naam ka eventListner attached kiya gya hai jab xhr loadned ko chalayega to ye abortSignal signal mai se abort eventListner remove karta hai
//             xhr.addEventListener("loadend", () => {
//                 if (uploadOptions.abortSignal) {
//                     uploadOptions.abortSignal.removeEventListener("abort", onAbortHandler);
//                 }
//             });
//         }
//         // yes open method jo ki xhr ke pass hai, ke pass 2 argument leta hai ek methods ka naam aur dusra kaha bhejana hai
//         xhr.open('POST', 'https://upload.imagekit.io/api/v1/files/upload');
//         // xhr ke property onerror ke under ek funtion attach kiya gya hai, wo Network Error ko return karta hai 
//         xhr.onerror = function (e) {
//             return reject(new ImageKitUploadNetworkError(errorMessages.UPLOAD_ENDPOINT_NETWORK_ERROR.message));
//         };
//         // onload ek property hai jisko function attach kiya gya hai aur yes funtion mujhe lagta hai tab chalata hi jab funtion response api se aa jata hai tab, aap ese explain kar sakte ho
//         xhr.onload = function () {
//             // xhr ke pass status naam ka property hota hai es conditionally check kiya ja rha hai kya status ki value 200 or eske upar hai but 300 se niche ha, agar ha to block code chalega
//             if (xhr.status >= 200 && xhr.status < 300) {
//                 // JSON object ke parse methods ke under xhr ki property responseText ki value ko dala jayega jo ki api se waps aaya 
//                 try {
//                     var body = JSON.parse(xhr.responseText);
//                     // addResponseHeadersAndBody ko do argument chiye body jo ki responseText ka object verson hai aur pura ka pura xhr intialised, that have now methods 
//                     var uploadResponse = addResponseHeadersAndBody(body, xhr);
//                     return resolve(uploadResponse);
//                 } catch (ex) {
//                     return reject(ex);
//                 }
//             } else if (xhr.status >= 400 && xhr.status < 500) {
//                 try {
//                     var body = JSON.parse(xhr.responseText);
//                     return reject(new ImageKitInvalidRequestError(body.message ?? "Invalid request. Please check the parameters.", getResponseMetadata(xhr)));
//                 } catch (ex) {
//                     return reject(ex);
//                 }
//             } else {
//                 try {
//                     var body = JSON.parse(xhr.responseText);
//                     return reject(new ImageKitServerError(body.message ?? "Server error occurred while uploading the file. This is rare and usually temporary.", getResponseMetadata(xhr)));
//                 } catch (ex) {
//                     return reject(new ImageKitServerError("Server error occurred while uploading the file. This is rare and usually temporary.", getResponseMetadata(xhr)));
//                 }
//             }
//         };
//         xhr.send(formData);
//     });
// };
// // ye methods 2 parameter leta hai first body aur 2 xhr, 
// const addResponseHeadersAndBody = (body, xhr) => {
//     // response ke under body object ki shallow copy attach ki gae hai
//     let response = {
//         ...body
//     };
//     // getResponseMetadata ko xhr ki value bheji gayi hai
//     const responseMetadata = getResponseMetadata(xhr);
//     Object.defineProperty(response, "$ResponseMetadata", {
//         value: responseMetadata,
//         enumerable: false,
//         writable: false
//     });
//     return response;
// };
// // ye function xhr ko as parameterleta hai , ye ek aur methods ko bulata hai
// const getResponseMetadata = xhr => {
//     // getResponseHeaderMap ko phir xhr bheja gya hai
//     const headers = getResponseHeaderMap(xhr);
//     const responseMetadata = {
//         statusCode: xhr.status,
//         headers: headers,
//         requestId: headers["x-request-id"]
//     };
//     return responseMetadata;
// };
// // ye function getResponseHeaderMap ko xhr pass kiya gya hai
// function getResponseHeaderMap(xhr) {
//     // esne ek variable headers banaya hai jisko empty object phit kiya hai
//     const headers = {};

//     const responseHeaders = xhr.getAllResponseHeaders();
//     if (Object.keys(responseHeaders).length) {
//         responseHeaders.trim().split(/[\r\n]+/).map(value => value.split(/: /)).forEach(keyValue => {
//             headers[keyValue[0].trim().toLowerCase()] = keyValue[1].trim();
//         });
//     }
//     return headers;
// }






















// // maine ek array banay with obj holding jo ki heap memory mai rha hai, as a reference,
// const redux = [{id:1,todo:false},{id:2,todo:true}]

// // maine ek function banaya jo ki ek parameter leti hai, funtion ki body us parameter par find naam ka methods use karti hai, aur find sabhi array ke element ke pass jate hai jo ki ek obj hai aur unkin keys jo ki id hai us se 1 ko match kar te hai, aur return kar delete hai jo bhi match index hota hai , object todo ke under aa gya hai, mai todo jo ki find ke dawara return kiye gaye object ko hold kar rha hai todo, us object ke toto ki value mai opposite value put kar diya jata hai, 

// // mera question ye hai ki todo jo ki find ke dwara return object ko hold kar rha hai jo ki array ki index value hai, job mai es mai changes kar ta hu to original redux jo ki array hold kar rha hai mai, update kaise ho jata hai, can you explain memory more details that i can understand what i want to understand behind the scene
// const nana = (state)=>{
//    const todo =  state.find((v,i)=> v.id === 1);
//    todo.todo = !todo.todo
// }

// nana(redux);

// console.log(redux);

// let a = 10;
// let b = a; // b = 10 (copy)
// b = 20;
// console.log(b); // 10 (unchanged)



// let obj1 = { name: "A" };
// let obj2 = obj1; // sirf reference copy hua

// obj2.name = "B";

// console.log(obj1.name); // "B" (kyunki dono same heap wale object ko point kar rahe)


















// const template = "# this is the best in the world #"
// const reges = /^#(?<text>.*)#$/
// const templates = template.replace(reges, "{##}");
// const templateMatch = template.match(reges)
// console.log(templates)
// console.log(templateMatch)













// // ! Important
// // classObject jo bhi changes karega wo reference mai hoga aur this.todo jaha reference liya hai waha changes dikhega
// function classObjectUpdate(req){
//     console.log(req);
//     console.log("this",this);


//     req["new"] = "Yes"
// }

// // classObjectUpdate(data)

// // maine ek class banaya hai
// class req{
//     // constructor this jo ki ek empty object hai us ke under todo naam ka property banata hai use ko ek empty deta hai
//     // this.down ek propery banat hai us ke under adding methods ko call kiya jata hai, use ka argument ek empty pass kiya gya hai internally this.todo ek memory mai banaya gya  ka reference rkhata hai
//     constructor(){
//         this.todo = {}
//         this.down = this.adding(this.todo)
//     }

//     // adding ek methods hai 
//     adding(data){
//         // aap classObjectUpdate ko call kar rhai ho aur yha se koe cheej return nhi kar rhai ho to undefined hota hai
//         classObjectUpdate(data)
//     }
// }

// const value1 = new req()
// console.log(value1);





























// const arr = [1,3,3,4,5,7,7,2];

// function removeDuplicate(arr){
//     // ek empty array banaya hai es ke under mai sir first time ke value ko rakhunga
//     let newArr = [];

//     // ye ek look hai jo, array ki jitni bhi length hogi utne bar chalega, array ki length 1 se suru hoti hai lekin array ke under ke element ko 0 ki position par rakha jata hai, es for look mai sabse phle let and arr leight chalenge , dusri baar iteration se kewal i++ aur condition checking hogi 
//     for (let i = 0; i < arr.length; i++) {
//         // incldes ek methods hai jo pata lgata hai ki kisi array ke under wo value maujud hai or nhi, ye ef methods ka condition checking pata laga rha hai ki newArr mai arr[i] par jo value hai wo newArr ke under hai ya nhi yadi hai to false kar do kyuki humnai exclamation mark lagaya hai jo ulta karta hai, es ka matlab hai ki newArr jo humnai bnaya hai usmai maujud nhi hai
//         if (!newArr.includes(arr[i])) {
//         // agar maujut nhi hai to push kar do 
//             newArr.push(arr[i])
//         }else{
//             continue
//         }
//     }
//     return newArr
// }

// function removeDuplicate(arr){
//     // obj es liye hai ki hum pata laga sake ki jo kese hai uski value ek hai to eska matlab hai ki wo aa chuka hai 
//     let obj = {}, newArr = [];

//     for (let i = 0; i < arr.length; i++) {
//         // agar obj ke under ki keys ki value ek hai to wah newArr mai push ho gya hai
//         if (obj[arr[i]] === 1) {
//             // continue ka matlab hai ki next index value se suru karo
//             continue
//         }else{
//             // push method ka use hum array mai value ko dalane ke liye karte hai
//             newArr.push(arr[i])
//             // ye obj ke under ek key banata hai wi arr[i] ki value ke sath aur uski value 1 deta hai, jiska upar if condition mai check hoga
//             obj[arr[i]] = 1
//         }
//     }
//     return newArr
// }

// console.log(removeDuplicate(arr.sort((chota,bada)=> chota-bada)))


// debouncing and throttling, reconcilation, virtual dom, real dom, controll components and uncontrollcomponents, lifecycle


































// question one
// 1. aap ek function likhiye jo ki array ko as a params leta hai wah params array hold difference types of data types , it can include the text , object, array , numbers, undefined, null, etc..

// 2. aap ko sabse pahle filter out karna hai, ki konsa number nhi hai, sirf wahi rakho jo number hai

// 3. ab number ke sath karna hai, har ek even (2,4,6,) divided by 2 and remaining 0 number ko double kar do, aur odd ( not divided by 2) number mai 5 aur jod do,

// 4. end mai en sabhi numbers ka sum return kar do, 

// 5. agar koe number nhi hai to 0 return kar do

// 6. concepts tags, function declaration, filter (return array index value if conditon true), typeof, map (is used for tranformation), reduce (is used for minimizing the array value), modular operator (%, (8 % 2)) it is like getting value is divided and getting 0 remaining


// const arra = ["Helo", { name: "Chandan" }, [], undefined, null];

// function processedNumbers(array) {
//     // it will give me return only number array, typeof elem return string with difference types numbers, if no then return empty array
//     const numberOnly = array.filter((elem, i) => typeof elem === 'number');
//     // console.log("filter NumberOnly:- ", numberOnly);
    
//     // it will change the array of numbers value with conditon matching, if no then return empty array
//     const tranformatedArrayNumber = numberOnly.map((elem, i) => elem % 2 === 0 ? elem*2 : elem + 5);
//     // console.log("tranformatedArrayNumber:- ", tranformatedArrayNumber);

//     // it will shrink the array into the single value, it will return 0
//     const reduceArrayIntoOneNumber = tranformatedArrayNumber.reduce((prev,curr,curIndex,arr)=>{
//         prev = prev + curr;
//         return prev
//     },0);

//     // console.log("reduceArrayIntoOneNumber:- ", reduceArrayIntoOneNumber);
    

//     return reduceArrayIntoOneNumber
// }

// console.log(processedNumbers(arra))













// aap ek funtion banaeye jo ki sentance ko leta hai jo ki under structure way mai hota hai use structure way mai likho,
// pahla character of sentence make it upper and ohter make it lower case and if you give javascript then replace it wit JavaScript
// concept, trim (ye methods suru ke aur last ke trailing space ko hta deta hai), split (ye methods aap ke string ko diye gye input ke adhaar par divide kar dega), slice ( ye methods us string ko cutting ke kaam karta hai), map , regular expression

// const str = "hello world, this is the javascript test" // ("Hello world, this is the JavaScript test.")

// function stringStructure(str){
//     // slipt return array by dividing whole string, slice is used for getting only the piece of str
//     // console.log(str.split(","),str.slice(1).toLowerCase());
    
//     str =  str[0].toUpperCase() + str.slice(1).toLowerCase();
//     str =  str.replace("javascript","JavaScript");
//     return `"${str.trim()}."`
// }

// console.log(stringStructure(str))




















// use of var, let, closures and setTimeout
// this event loop when loop run then setTimeout will be register in the taskQueue and wait its turn 
// for(var i = 0; i < 3 ; i++){
//     setTimeout(function(){
//         console.log(i);
        
//     }, 100 * i)
// } // output getting 3,3,3, var forget its scope what was its value was


// for (let j = 0; j < 3; j++) {
//     setTimeout(function(){
//         console.log(j);
        
//     },100 * j)
    
// } // output getting 0,1,2, but let remember it value
















// make a higher order function which take params as factor and return a another funtion which also take number and return multiply value if not factor passed then it return 1 with the help of ternary operator

// function createMultiplier(factor){
//     return (number)=>{        
//         // factor when not present the it will be undefined and undefined * number will give NaN , so 1 will be return
//         return factor * number || 1
//     }
// }

// const fun1 = createMultiplier(3);
// facter will come in closures of fun1 backpack
// console.log(fun1(3))













// aap ek funtion banao wo function do params leta hai , dekho ki wo dono params number hai ya nhi, if either number not then throw error then invalide params

// function safeDivide(numerator,denomineter){
//     try {
//         if (typeof numerator !== 'number' || typeof denomineter !== 'number') {
//             throw new Error("Invalid params value, must be number ")
//         }

//         if (denomineter === 0) {
//             console.warn("Infinity")
//         }else{
//             return numerator / denomineter
//         }

//     } catch (error) {
//         console.log(error);
        
//     }
// }


// console.log(safeDivide(4,"0"))






