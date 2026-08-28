import { Body, Controller, Param, Patch, Post } from "@nestjs/common";
import { SubmitKycDto } from "./dto/submit-kyc.dto";
import { UpdateKycStatusDto } from "./dto/update-kyc-status.dto";
import { KycService } from "./kyc.service";

@Controller("kyc")
export class KycController {
  constructor(private readonly kycService: KycService) {}

  @Post("submit")
  submit(@Body() payload: SubmitKycDto) {
    return this.kycService.submit(payload);
  }

  @Patch(":userId/status")
  updateStatus(
    @Param("userId") userId: string,
    @Body() payload: UpdateKycStatusDto,
  ) {
    return this.kycService.updateStatus(userId, payload);
  }
}
