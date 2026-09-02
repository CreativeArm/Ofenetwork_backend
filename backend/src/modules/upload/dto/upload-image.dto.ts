import { IsOptional, IsString } from "class-validator";

export class UploadImageDto {
  @IsString()
  data!: string;

  @IsOptional()
  @IsString()
  folder?: string;
}
