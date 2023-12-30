import { getServerSession } from '#auth';
import type { Session } from 'next-auth';
import { SelectUser } from '~/db/schema';

export default eventHandler(async (event) => {
   const session = await getServerSession(event);
   event.context.session = session as Session & { user: SelectUser };
});
