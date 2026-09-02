import { Injectable, Logger } from "@nestjs/common";
import { v2 as cloudinary, UploadApiResponse } from "cloudinary";

@Injectable()
export class CloudinaryService {
  private readonly logger = new Logger(CloudinaryService.name);
  private isConfigured = false;

  constructor() {
    this.checkConfig();
  }

  private checkConfig(): boolean {
    const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
    const apiKey = process.env.CLOUDINARY_API_KEY;
    const apiSecret = process.env.CLOUDINARY_API_SECRET;

    if (cloudName && apiKey && apiSecret) {
      cloudinary.config({
        cloud_name: cloudName,
        api_key: apiKey,
        api_secret: apiSecret,
        secure: true,
      });
      this.isConfigured = true;
      return true;
    }
    return false;
  }

  get configured(): boolean {
    return this.isConfigured || this.checkConfig();
  }

  async uploadImage(
    fileData: string,
    folder = "general",
  ): Promise<{ url: string; publicId: string }> {
    if (!this.configured) {
      throw new Error(
        "Cloudinary is not configured. Please set CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET in backend .env",
      );
    }

    return new Promise((resolve, reject) => {
      cloudinary.uploader.upload(
        fileData,
        {
          folder: `ofenetworks/${folder}`,
          resource_type: "auto",
          transformation: [
            { quality: "auto:good", fetch_format: "auto" },
          ],
        },
        (error, result?: UploadApiResponse) => {
          if (error || !result) {
            this.logger.error("Cloudinary upload error", error);
            return reject(new Error(error?.message || "Failed to upload image to Cloudinary"));
          }

          resolve({
            url: result.secure_url,
            publicId: result.public_id,
          });
        },
      );
    });
  }
}
