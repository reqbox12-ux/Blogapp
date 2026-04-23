import { GoogleGenerativeAI } from "@google/generative-ai";
import fs from "fs";
import path from "path";
import dotenv from "dotenv";

dotenv.config();

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const IMAGE_MODEL = "gemini-2.5-flash-image";

async function addSecondImage(outDir, topic, keywords) {
  console.log(`[시스템] 두 번째 이미지 생성 중... (대상: ${outDir})`);
  
  try {
    const model = genAI.getGenerativeModel({
      model: IMAGE_MODEL,
      generationConfig: { responseModalities: ["IMAGE", "TEXT"] },
    });

    const prompt = `A beautiful, high-quality photograph of a group of diverse young children (ages 3-5) in a ballet studio. They are wearing cute ballet outfits, smiling, and attempting simple ballet poses together. The lighting is warm and natural, creating a cheerful and encouraging atmosphere. Soft focus background of the dance studio. No text. 16:9 ratio.`;

    const result = await model.generateContent(prompt);
    const parts = result.response.candidates?.[0]?.content?.parts || [];
    const imgPart = parts.find(p => p.inlineData?.mimeType?.startsWith("image/"));

    if (imgPart) {
      const imgBuffer = Buffer.from(imgPart.inlineData.data, "base64");
      const imgPath = path.join(outDir, "content_image.png");
      fs.writeFileSync(imgPath, imgBuffer);
      console.log(`[시스템] 이미지 생성 완료: content_image.png`);

      // HTML 파일들 수정
      const previewPath = path.join(outDir, "preview.html");
      const uploadPath = path.join(outDir, "upload_body.html");

      const imgTag = `\n<div style="text-align: center; margin: 40px 0;">\n  <img src="content_image.png" alt="발레 수업 중인 아이들" style="max-width: 100%; border-radius: 12px; box-shadow: 0 4px 15px rgba(0,0,0,0.1);">\n  <p style="color: #888; font-size: 0.9em; margin-top: 10px;">함께 즐겁게 발레를 배우는 아이들의 모습</p>\n</div>\n`;

      if (fs.existsSync(previewPath)) {
        let content = fs.readFileSync(previewPath, "utf-8");
        // 첫 번째 <h3> 태그 뒤에 삽입
        content = content.replace("</h3>", "</h3>" + imgTag);
        fs.writeFileSync(previewPath, content, "utf-8");
      }

      if (fs.existsSync(uploadPath)) {
        let content = fs.readFileSync(uploadPath, "utf-8");
        content = content.replace("</h3>", "</h3>" + imgTag);
        fs.writeFileSync(uploadPath, content, "utf-8");
      }
      
      console.log(`[시스템] HTML 파일에 이미지 삽입 완료.`);
    }
  } catch (err) {
    console.error(`[오류] 이미지 생성 실패: ${err.message}`);
  }
}

const outDir = process.argv[2];
const topic = "유아발레 시작 나이, 언제 보내면 좋을까?";
if (outDir) {
  addSecondImage(outDir, topic, []);
} else {
  console.log("출력 디렉토리 경로를 입력해주세요.");
}
