import { app, dialog, shell } from "electron";
import {
  existsSync,
  writeFile,
  mkdir,
  createReadStream,
  copyFile,
  readFile,
} from "node:fs";
import crypto from "crypto";
import path from "node:path";

const downloadsPath = app.getPath("downloads");
const saveDownloadsPath = path.join(downloadsPath, "sumi.chat Desktop");

const createSaveDownloadsFolder = () => {
  return new Promise((resolve, reject) => {
    const isExists = existsSync(saveDownloadsPath);
    isExists
      ? resolve(true)
      : mkdir(saveDownloadsPath, (err) => {
          err ? reject(err) : resolve(true);
        });
  });
};
createSaveDownloadsFolder();

export const cacheFile = ({ fileName, uint8Array }) => {
  return new Promise(async (resolve, reject) => {
    await createSaveDownloadsFolder();
    const buffer = Buffer.from(uint8Array);
    const filePath = path.join(saveDownloadsPath, fileName);
    const uniquePath = getUniqueFileName(filePath);
    writeFile(uniquePath, buffer, "utf-8", async function (err) {
      if (err) {
        reject(err);
      } else {
        const hash = await getFileMd5(uniquePath);
        resolve({ savePath: uniquePath, saveHash: hash });
      }
    });
  });
};

export const previewFile = async (filePath: string) => {
  return await shell.openPath(filePath);
};

export const saveAsFile = (
  data: string | { fileName: string; uint8Array: Uint8Array },
) => {
  const isString = typeof data === "string";
  return new Promise(async (resolve, reject) => {
    const saveRes = await dialog.showSaveDialog({
      title: "文件另存为",
      defaultPath: isString ? path.basename(data) : data.fileName,
    });
    if (!saveRes.filePath) return;
    if (isString) {
      copyFile(data, saveRes.filePath, async (err) => {
        err ? reject(err) : resolve(true);
      });
    } else {
      writeFile(
        saveRes.filePath,
        Buffer.from(data.uint8Array),
        "utf-8",
        async function (err) {
          err ? reject(err) : resolve(true);
        },
      );
    }
  });
};

const getUniqueFileName = (filePath: string) => {
  let index = 0;
  let uniquePath = filePath;

  while (existsSync(uniquePath)) {
    index++;
    const fileName = path.basename(filePath);
    const ext = path.extname(filePath);
    const baseName = fileName.slice(0, -ext.length);
    const numberedName = baseName + `(${index})` + ext;
    uniquePath = path.join(path.dirname(filePath), numberedName);
  }

  return uniquePath;
};

export const compareFiles = async ({ filePath, fileHash }) => {
  const isExists = existsSync(filePath);
  if (!isExists) return false;
  const hash = await getFileMd5(filePath);

  return fileHash === hash;
};

const getFileMd5 = (filePath: string, sizeLimit = 10 * 1024 * 1024) => {
  return new Promise((resolve, reject) => {
    const hash = crypto.createHash("md5");
    const stream = createReadStream(filePath, { start: 0, end: sizeLimit });

    stream.on("data", (data) => {
      hash.update(data);
    });

    stream.on("end", () => {
      const md5 = hash.digest("hex");
      resolve(md5);
    });

    stream.on("error", (error) => {
      reject(error);
    });
  });
};

export const getFile = ({ filePath }) => {
  return new Promise((reslove, reject) => {
    readFile(filePath, (err, data) => {
      err ? reject(err) : reslove({ data: data, name: path.basename(filePath) });
    });
    // const readableStream = fs.createReadStream(filePath);

    // let fileData = Buffer.from("");

    // readableStream.on("data", (chunk) => {
    //   fileData = Buffer.concat([fileData, chunk]);
    // });

    // readableStream.on("end", () => {
    //   // 发送文件数据到渲染进程
    //   event.sender.send("file-data", fileData, filePath);
    // });

    // readableStream.on("error", (error) => {
    //   console.error("An error occurred while reading the file:", error);
    // });
  });
};
