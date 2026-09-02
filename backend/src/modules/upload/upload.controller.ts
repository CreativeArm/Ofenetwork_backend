import { BadRequestException, Body, Controller, Post } from "@nestjs/common";
import { CloudinaryService } from "../../infrastructure/cloudinary/cloudinary.service";
import { UploadImageDto } from "./dto/upload-image.dto";

@Controller("upload")
export class UploadController {
  constructor(private readonly cloudinaryService: CloudinaryService) {}

  @Post()
  async upload(@Body() payload: UploadImageDto) {
    if (!payload.data) {
      throw new BadRequestException("Image data is required");
    }

    try {
      const result = await this.cloudinaryService.uploadImage(
        payload.data,
        payload.folder || "general",
      );
      return {
        url: result.url,
        publicId: result.publicId,
      };
    } catch (error: any) {
      throw new BadRequestException(error?.message || "Failed to upload image");
    }
  }
}
