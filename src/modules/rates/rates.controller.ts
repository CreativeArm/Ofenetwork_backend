import { Body, Controller, Delete, Get, Param, Patch, Post } from "@nestjs/common";
import { RatesService } from "./rates.service";
import { CreateRateDto } from "./dto/create-rate.dto";
import { UpdateRateDto } from "./dto/update-rate.dto";

@Controller("rates")
export class RatesController {
  constructor(private readonly ratesService: RatesService) {}

  @Get()
  list() {
    return this.ratesService.list();
  }

  @Post()
  create(@Body() payload: CreateRateDto) {
    return this.ratesService.create(payload);
  }

  @Patch(":id")
  update(@Param("id") id: string, @Body() payload: UpdateRateDto) {
    return this.ratesService.update(id, payload);
  }

  @Delete(":id")
  remove(@Param("id") id: string) {
    return this.ratesService.remove(id);
  }
}
