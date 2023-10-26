import { nanoid } from 'nanoid';
import NextAuth from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';

export default NextAuth({
  providers: [
    CredentialsProvider({
      name: 'Login',
      async authorize(credentials) {
        if (credentials) {
          const name = credentials.name;
          const id = nanoid();
          return {
            id: id,
            name: name,
            email: id,
          };
        }
        return null;
      },
      credentials: {
        name: { type: 'test' },
      },
    }),
  ],
});
