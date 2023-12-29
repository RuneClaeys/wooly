import { NuxtAuthHandler } from '#auth';
import { eq } from 'drizzle-orm';
import { Profile, User } from 'next-auth';
import GoogleProvider from 'next-auth/providers/google';
import { users } from '~/db/schema';
import { db } from '~/server/services/drizzle.service';

type GoogleProfile = Profile & {
   given_name?: string;
   family_name?: string;
};

function checkUserExists(email: string) {
   return db.select().from(users).where(eq(users.email, email)).get();
}

function createUser({ user, profile }: { user: User; profile?: GoogleProfile }) {
   db.insert(users)
      .values({
         email: user.email,
         firstName: profile?.given_name,
         lastName: profile?.family_name,
      })
      .execute();
}

function signIn({ user, profile }: { user: User; profile?: GoogleProfile }) {
   if (!user.email) return false;

   const exists = checkUserExists(user.email);
   if (!exists) createUser({ user, profile });

   return true;
}

export default NuxtAuthHandler({
   secret: process.env.AUTH_SECRET,

   providers: [
      // @ts-expect-error You need to use .default here for it to work during SSR. May be fixed via Vite at some point
      GoogleProvider.default({
         clientId: process.env.GOOGLE_AUTH_CLIENT_ID,
         clientSecret: process.env.GOOGLE_AUTH_CLIENT_SECRET,
      }),
   ],

   callbacks: {
      signIn,
   },
});
