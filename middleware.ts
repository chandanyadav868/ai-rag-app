import { auth } from "@/auth";
import { NextRequest, NextResponse } from "next/server";

export default function middleware(req:NextRequest) {
  const { pathname } = req.nextUrl;

  // ✅ Skip auth check for this API
  if (pathname.startsWith("/api/mongoose")) {
    return NextResponse.next();
  }

  return auth;
}