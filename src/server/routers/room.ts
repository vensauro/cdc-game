/**
 *
 * This is an example router, you can delete this file and then update `../pages/api/trpc/[trpc].tsx`
 */
import { observable } from '@trpc/server/observable';
import { EventEmitter } from 'events';
import { z } from 'zod';
import { authedProcedure, publicProcedure, router } from '../trpc';
import { GameAction, Game, GameUser, db } from '../db';
import { TRPCError } from '@trpc/server';
import { cluster, list, range, shuffle, sort, uid } from 'radash';

interface MyEvents {
  minus: (data: Game) => void;
  [key: `update:${string}`]: (data: Game) => void;
}

declare interface MyEventEmitter {
  on<TEv extends keyof MyEvents>(event: TEv, listener: MyEvents[TEv]): this;
  off<TEv extends keyof MyEvents>(event: TEv, listener: MyEvents[TEv]): this;
  once<TEv extends keyof MyEvents>(event: TEv, listener: MyEvents[TEv]): this;
  emit<TEv extends keyof MyEvents>(
    event: TEv,
    ...args: Parameters<MyEvents[TEv]>
  ): boolean;
}

class MyEventEmitter extends EventEmitter {}

const ee = new MyEventEmitter();

export const roomRouter = router({
  add: authedProcedure
    .input(
      z.object({
        code: z.string().optional(),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      const { name, email } = ctx.user;

      const code = input.code || uid(4);

      const user: GameUser = {
        cards: [],
        name,
        id: email ?? uid(10),
      };

      const dbGame = db.get(code);
      if (dbGame) {
        if (!dbGame.users.find((e) => e.id === email)) {
          dbGame.users.push(user);
          db.set(code, dbGame);
          ee.emit(`update:${code}`, dbGame);
        }

        return dbGame;
      }

      const newGame: Game = {
        code,
        gameAction: [],
        owner: user,
        users: [user],
        actualAction: { card: -1, user, startedAt: new Date() },
        state: 'LOBBY',
        restingJokers: 8,
      };
      db.set(code, newGame);

      return newGame;
    }),

  read: authedProcedure
    .input(z.object({ code: z.string() }))
    .query(async ({ input: { code } }) => {
      const dbGame = db.get(code);
      if (!dbGame) {
        throw new TRPCError({ code: 'NOT_FOUND' });
      }

      return dbGame;
    }),

  start: authedProcedure
    .input(z.object({ code: z.string() }))
    .mutation(async ({ input: { code } }) => {
      const dbGame = db.get(code);
      if (!dbGame) {
        throw new TRPCError({ code: 'NOT_FOUND' });
      }

      const cardsNumbers = list(8, 31);
      const cards = cluster(
        shuffle(cardsNumbers),
        cardsNumbers.length / dbGame.users.length,
      );

      const card_order: GameAction[] = [];

      for (const index of range(dbGame.users.length - 1)) {
        dbGame.users[index].cards = cards[index];

        for (const card of cards[index]) {
          card_order.push({
            user: dbGame.users[index],
            card,
          });
        }
      }

      dbGame.gameAction = sort(card_order, (e) => e.card);
      const lastAction = dbGame.gameAction.shift();
      if (lastAction) {
        dbGame.actualAction = { ...lastAction, startedAt: new Date() };
      }
      dbGame.state = 'STARTED';

      db.set(code, dbGame);
      ee.emit(`update:${code}`, dbGame);
    }),

  next: authedProcedure
    .input(z.object({ code: z.string() }))
    .mutation(async ({ input: { code } }) => {
      const dbGame = db.get(code);
      if (!dbGame) {
        throw new TRPCError({ code: 'NOT_FOUND' });
      }

      const lastAction = dbGame.gameAction.shift();
      if (lastAction) {
        dbGame.actualAction = { ...lastAction, startedAt: new Date() };
      } else {
        dbGame.state = 'ENDED';
      }

      db.set(code, dbGame);
      ee.emit(`update:${code}`, dbGame);
    }),

  joker: authedProcedure
    .input(z.object({ code: z.string() }))
    .mutation(async ({ input: { code }, ctx }) => {
      const { email } = ctx.user;

      const dbGame = db.get(code);
      if (!dbGame) {
        throw new TRPCError({ code: 'NOT_FOUND' });
      }

      const user = dbGame.users.find((e) => e.id === email);

      if (
        !user ||
        dbGame.restingJokers <= 0 ||
        dbGame.gameAction?.[0]?.user.id === user.id ||
        dbGame.gameAction?.[0].card === 1 ||
        dbGame.actualAction.user.id === user.id
      ) {
        throw new TRPCError({ code: 'FORBIDDEN' });
      }

      dbGame.gameAction.unshift({
        card: 1,
        user,
      });
      dbGame.restingJokers = dbGame.restingJokers - 1;

      db.set(code, dbGame);
      ee.emit(`update:${code}`, dbGame);
    }),

  onAdd: publicProcedure
    .input(z.object({ code: z.string() }))
    .subscription(({ input }) => {
      return observable<Game>((emit) => {
        const onAdd = (data: Game) => {
          emit.next(data);
        };
        ee.on(`update:${input.code}`, onAdd);
        return () => {
          ee.off(`update:${input.code}`, onAdd);
        };
      });
    }),
});
