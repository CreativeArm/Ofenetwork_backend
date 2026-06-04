import { IsOptional, IsString } from "class-validator";

export class UpdateProfilePictureDto {
  @IsOptional()
  @IsString()
  profileImageUrl?: string | null;
}
