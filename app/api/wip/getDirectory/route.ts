import { getDirectoryStructure } from "@/lib/utils/generateNav";
import { NextResponse } from "next/server";
import path from "path";

export async function GET() {
	const appDirectory = path.join(process.cwd(), "app"); // Path to your app directory
	const directoryStructure = getDirectoryStructure(appDirectory);

	return NextResponse.json(directoryStructure);
}
