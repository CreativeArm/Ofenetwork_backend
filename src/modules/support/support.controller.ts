import { Body, Controller, Get, Param, Patch, Post, Query } from "@nestjs/common";
import { SupportTicketStatus } from "@prisma/client";
import { CreateSupportTicketDto } from "./dto/create-support-ticket.dto";
import { UpdateSupportTicketDto } from "./dto/update-support-ticket.dto";
import { SupportService } from "./support.service";

@Controller("support")
export class SupportController {
  constructor(private readonly supportService: SupportService) {}

  @Post("tickets")
  createTicket(@Body() payload: CreateSupportTicketDto) {
    return this.supportService.create(payload);
  }

  @Get("tickets")
  listTickets(@Query("status") status?: SupportTicketStatus) {
    return this.supportService.list(status);
  }

  @Patch("tickets/:id")
  updateTicket(
    @Param("id") id: string,
    @Body() payload: UpdateSupportTicketDto,
  ) {
    return this.supportService.update(id, payload);
  }
}
