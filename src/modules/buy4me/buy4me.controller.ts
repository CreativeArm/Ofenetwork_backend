import { Body, Controller, Get, Param, Patch, Post, Query } from "@nestjs/common";
import { Buy4MeService } from "./buy4me.service";
import { CreateBuy4MeDto } from "./dto/create-buy4me.dto";
import { PriceBuy4MeDto } from "./dto/price-buy4me.dto";
import { SubmitBuy4MePaymentDto } from "./dto/submit-buy4me-payment.dto";
import { UpdateBuy4MeStatusDto } from "./dto/update-buy4me-status.dto";
import { CancelBuy4MeDto } from "./dto/cancel-buy4me.dto";

@Controller("buy4me")
export class Buy4MeController {
  constructor(private readonly buy4meService: Buy4MeService) {}

  @Post()
  createOrder(@Body() payload: CreateBuy4MeDto) {
    return this.buy4meService.createOrder(payload);
  }

  @Get()
  listOrders(@Query("userId") userId?: string) {
    return this.buy4meService.listOrders(userId);
  }

  @Patch(":id/price")
  priceOrder(@Param("id") id: string, @Body() payload: PriceBuy4MeDto) {
    return this.buy4meService.priceOrder(id, payload);
  }

  @Patch(":id/payment")
  submitPayment(
    @Param("id") id: string,
    @Body() payload: SubmitBuy4MePaymentDto,
  ) {
    return this.buy4meService.submitPayment(id, payload);
  }

  @Patch(":id/cancel")
  cancelOrder(@Param("id") id: string, @Body() payload: CancelBuy4MeDto) {
    return this.buy4meService.cancelOrder(id, payload);
  }

  @Patch(":id/status")
  updateStatus(
    @Param("id") id: string,
    @Body() payload: UpdateBuy4MeStatusDto,
  ) {
    return this.buy4meService.updateStatus(id, payload);
  }

  @Patch(":id/complete")
  completeOrder(@Param("id") id: string, @Body() payload: { actorId: string }) {
    return this.buy4meService.completeOrder(id, payload.actorId);
  }
}
