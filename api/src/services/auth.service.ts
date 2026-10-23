import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { userRepository, CreateUserData } from '../repositories/user.repository';

const JWT_SECRET = process.env.JWT_SECRET || 'super-secret-revisao-show-do-milhao-jwt-key';

export class AuthService {
  async login(email: string, password: string) {
    const user = await userRepository.findByEmail(email);
    if (!user) {
      throw new Error('Credenciais inválidas. Verifique seu e-mail e senha.');
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      throw new Error('Credenciais inválidas. Verifique seu e-mail e senha.');
    }

    const token = jwt.sign(
      { id: user.id, email: user.email, name: user.name },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    return {
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
      },
    };
  }

  async getProfile(userId: string) {
    const user = await userRepository.findById(userId);
    if (!user) {
      throw new Error('Usuário não encontrado.');
    }

    return {
      id: user.id,
      name: user.name,
      email: user.email,
    };
  }

  async registerAdmin(data: CreateUserData) {
    const existing = await userRepository.findByEmail(data.email);
    if (existing) {
      throw new Error('Já existe um usuário cadastrado com este e-mail.');
    }

    const hashedPassword = await bcrypt.hash(data.password, 10);
    const user = await userRepository.create({
      ...data,
      password: hashedPassword,
    });

    return {
      id: user.id,
      name: user.name,
      email: user.email,
    };
  }
}

export const authService = new AuthService();
