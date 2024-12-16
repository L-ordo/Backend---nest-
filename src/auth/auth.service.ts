import { BadRequestException, Injectable, InternalServerErrorException, UnauthorizedException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { User } from './entities/user.entity';
import { Model } from 'mongoose';

import * as bcryptjs from 'bcryptjs'

import { CreateUserDto, loginDto, RegisterUserDto, UpdateAuthDto } from './dto';
import { IsEmail } from 'class-validator';
import { REDIRECT_METADATA } from '@nestjs/common/constants';
import * as request from 'supertest';
import { JwtService } from '@nestjs/jwt';
import { JwtPayload } from './interfaces/jwt-payload';
import { LoginResponse } from './interfaces/login-response';
import { find } from 'rxjs';

@Injectable()
export class AuthService {

  constructor(
    @InjectModel( User.name ) 
    private userModel: Model<User>,

    private jwtService: JwtService,
  ){}

   async create(createUserDto: CreateUserDto): Promise<User> {
    console.log(createUserDto)
    
    
    try {
      
      const { password, ...userData } = createUserDto;
      
      const newUser = new this.userModel( {
        //1 encriptar la contraseña
        
        password: bcryptjs.hashSync( password,10 ),
        ...userData
      } );
      
      //2 Guardar el usuario

       await newUser.save();

       const { password:_ , ...user } = newUser.toJSON();

      return user;
      
    } catch (error) {
        // console.log(error.code);
        if( error.code = 11000 ){
          throw new BadRequestException(`${ createUserDto.email} alredy exits! `)
        }
        throw new InternalServerErrorException('Something terribe happen!!!')
    }


  }

  async register( registerDto: RegisterUserDto ):Promise<LoginResponse>{

    const user = await this.create( registerDto  );
    // console.log(user);
    return{
      user: user,
      token: this.getJwtToken({ id: user._id })
    }
    
  }

  // Verificacion del login
    async login(loginDto: loginDto):Promise<LoginResponse>{
      const { email, password } = loginDto;

      const user = await this.userModel.findOne({ email });
      if ( !user ){
        throw new UnauthorizedException( ' Not valid  credentials -email');
      }

      if(!bcryptjs.compareSync( password, user.password ) ){
        throw new UnauthorizedException( ' Not Valid credentials credentials - passwprd ' );
      }
      
      const { password:_, ...rest } =  user.toJSON();

      return{
        user: rest,
        token: this.getJwtToken({ id: user.id })
      }

  }


  findAll(): Promise<User[]> {
    return this.userModel.find();
  }

  async findUserById( id:string ){
    const user = await this.userModel.findById( id );
    const { password, ...rest } = user.toJSON();
    return rest;
  }

  findOne(id: number) {
    return `This action returns a #${id} auth`;
  }

  update(id: number, updateAuthDto: UpdateAuthDto) {
    return `This action updates a #${id} auth`;
  }

  remove(id: number) {
    return `This action removes a #${id} auth`;
  }

  getJwtToken( payload: JwtPayload ){

    const token = this.jwtService.sign(payload);
    return token;
  }
}
