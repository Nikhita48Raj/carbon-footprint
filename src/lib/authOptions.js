import CredentialsProvider from 'next-auth/providers/credentials';
import connectDB from '@/lib/db';
import User from '@/models/User';

/**
 * Centralised NextAuth configuration.
 * Import and pass to getServerSession(authOptions) in every API route
 * so session resolution never silently fails.
 */
export const authOptions = {
  providers: [
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email:    { label: 'Email',    type: 'email'    },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error('Email and password are required');
        }
        await connectDB();
        const user = await User.findOne({ email: credentials.email }).select('+password');
        if (!user) throw new Error('No account found with that email');
        const isValid = await user.comparePassword(credentials.password);
        if (!isValid) throw new Error('Incorrect password');
        return {
          id: user._id.toString(),
          name: user.name,
          email: user.email,
          onboardingComplete: user.profile.onboardingComplete,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.onboardingComplete = user.onboardingComplete;
      }
      return token;
    },
    async session({ session, token }) {
      if (token) {
        session.user = session.user || {};
        session.user.id    = token.id;
        session.user.onboardingComplete = token.onboardingComplete;
      }
      return session;
    },
  },
  pages: {
    signIn: '/auth/login',
    error:  '/auth/login',
  },
  session: { strategy: 'jwt' },
  secret: process.env.NEXTAUTH_SECRET,
};
