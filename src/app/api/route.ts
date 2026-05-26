import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({
    name: "TeamFlow",
    version: "1.0.0",
    description: "AI-powered team management platform"
  });
}
