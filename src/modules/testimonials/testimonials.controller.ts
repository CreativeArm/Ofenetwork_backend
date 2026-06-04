import { Body, Controller, Get, Param, Patch, Query } from "@nestjs/common";
import { TestimonialStatus } from "@prisma/client";
import { UpdateTestimonialStatusDto } from "./dto/update-testimonial-status.dto";
import { TestimonialsService } from "./testimonials.service";

@Controller("testimonials")
export class TestimonialsController {
  constructor(private readonly testimonialsService: TestimonialsService) {}

  @Get()
  list(@Query("status") status?: TestimonialStatus) {
    return this.testimonialsService.list(status);
  }

  @Patch(":id/status")
  updateStatus(
    @Param("id") id: string,
    @Body() payload: UpdateTestimonialStatusDto,
  ) {
    return this.testimonialsService.updateStatus(id, payload.status);
  }
}
