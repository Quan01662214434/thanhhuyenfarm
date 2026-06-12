import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsString, MinLength } from 'class-validator';

export class LoginDto {
  @ApiProperty({ example: 'owner@farm.demo' })
  @IsEmail()
  email!: string;

  @ApiProperty({ example: 'Demo@12345' })
  @IsString()
  @MinLength(6)
  password!: string;
}
