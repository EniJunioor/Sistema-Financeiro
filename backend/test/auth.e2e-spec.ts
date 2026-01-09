import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/common/prisma/prisma.service';

describe('AuthController (e2e)', () => {
  let app: INestApplication;
  let prismaService: PrismaService;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    prismaService = moduleFixture.get<PrismaService>(PrismaService);
    
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(async () => {
    // Clean up test data
    await prismaService.user.deleteMany({
      where: {
        email: {
          contains: 'test',
        },
      },
    });
  });

  describe('/auth/register (POST)', () => {
    it('should register a new user successfully', () => {
      const registerDto = {
        email: 'test@example.com',
        password: 'TestPass123!',
        name: 'Test User',
      };

      return request(app.getHttpServer())
        .post('/auth/register')
        .send(registerDto)
        .expect(201)
        .expect((res) => {
          expect(res.body).toHaveProperty('access_token');
          expect(res.body).toHaveProperty('token_type', 'Bearer');
          expect(res.body).toHaveProperty('expires_in');
          expect(res.body).toHaveProperty('user');
          expect(res.body.user).toHaveProperty('email', registerDto.email);
          expect(res.body.user).toHaveProperty('name', registerDto.name);
          expect(res.body.user).not.toHaveProperty('password');
        });
    });

    it('should reject registration with weak password', () => {
      const registerDto = {
        email: 'test2@example.com',
        password: 'weak',
        name: 'Test User 2',
      };

      return request(app.getHttpServer())
        .post('/auth/register')
        .send(registerDto)
        .expect(400);
    });

    it('should reject registration with invalid email', () => {
      const registerDto = {
        email: 'invalid-email',
        password: 'TestPass123!',
        name: 'Test User 3',
      };

      return request(app.getHttpServer())
        .post('/auth/register')
        .send(registerDto)
        .expect(400);
    });
  });

  describe('/auth/login (POST)', () => {
    beforeEach(async () => {
      // Create a test user for login tests
      const registerDto = {
        email: 'logintest@example.com',
        password: 'TestPass123!',
        name: 'Login Test User',
      };

      await request(app.getHttpServer())
        .post('/auth/register')
        .send(registerDto);
    });

    it('should login with valid credentials', () => {
      const loginDto = {
        email: 'logintest@example.com',
        password: 'TestPass123!',
      };

      return request(app.getHttpServer())
        .post('/auth/login')
        .send(loginDto)
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('access_token');
          expect(res.body).toHaveProperty('token_type', 'Bearer');
          expect(res.body).toHaveProperty('expires_in');
          expect(res.body).toHaveProperty('user');
          expect(res.body.user).toHaveProperty('email', loginDto.email);
          expect(res.body.user).not.toHaveProperty('password');
        });
    });

    it('should reject login with invalid credentials', () => {
      const loginDto = {
        email: 'logintest@example.com',
        password: 'WrongPassword123!',
      };

      return request(app.getHttpServer())
        .post('/auth/login')
        .send(loginDto)
        .expect(401);
    });

    it('should reject login with non-existent user', () => {
      const loginDto = {
        email: 'nonexistent@example.com',
        password: 'TestPass123!',
      };

      return request(app.getHttpServer())
        .post('/auth/login')
        .send(loginDto)
        .expect(401);
    });
  });
});