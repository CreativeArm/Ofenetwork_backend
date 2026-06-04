import { IsOptional, IsString } from "class-validator";

export class SubmitKycDto {
  @IsString()
  userId!: string;

  @IsString()
  documentType!: string;

  @IsString()
  documentUrl!: string;

  @IsOptional()
  @IsString()
  notes?: string;
}
