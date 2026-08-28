import { IsEmail, IsOptional, IsString, MaxLength, MinLength } from "class-validator";

export class CreateSupportTicketDto {
  @IsOptional()
  @IsString()
  userId?: string;

  @IsString()
  @MinLength(2)
  @MaxLength(100)
  name!: string;

  @IsEmail()
  @MaxLength(160)
  email!: string;

  @IsString()
  @MinLength(3)
  @MaxLength(80)
  topic!: string;

  @IsString()
  @MinLength(10)
  @MaxLength(2000)
  message!: string;
}
