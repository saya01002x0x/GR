import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { ArtworksController } from './artworks/artworks.controller';

@Module({
  imports: [AuthModule],
  controllers: [AppController, ArtworksController],
  providers: [AppService],
})
export class AppModule {}
