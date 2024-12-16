import { IsEmail, MinLength } from 'class-validator';

export class loginDto{

    @IsEmail()
    email: string;

    @MinLength(6)
    password:string;
}