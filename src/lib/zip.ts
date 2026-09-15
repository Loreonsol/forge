import JSZip from "jszip";
import type { Scaffold } from "./types";

export async function scaffoldToZipBuffer(scaffold: Scaffold): Promise<Buffer> {
  const zip = new JSZip();
  const root = zip.folder(scaffold.projectName);
  if (!root) throw new Error("Failed to create zip root");

  for (const file of scaffold.files) {
    root.file(file.path, file.content);
  }

  const content = await zip.generateAsync({
    type: "nodebuffer",
    compression: "DEFLATE",
    compressionOptions: { level: 6 },
  });
  return content;
}
