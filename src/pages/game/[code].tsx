import { Layout } from 'components/layout';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { trpc } from 'utils/trpc';
import { useAutoAnimate } from '@formkit/auto-animate/react';
import { Button } from 'components/button';
import { twMerge } from 'tailwind-merge';
import { useEffect, useMemo, useState } from 'react';
import { Game } from 'server/db';
import { useSession } from 'next-auth/react';
import RiseLoader from 'react-spinners/RiseLoader';
import toast, { Toaster } from 'react-hot-toast';

import copyToClipboard from 'copy-to-clipboard';
import { first, sort } from 'radash';

import confetti from 'canvas-confetti';

import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import duration from 'dayjs/plugin/duration';
import 'dayjs/locale/pt-br';
import Link from 'next/link';

dayjs.extend(relativeTime);
dayjs.extend(duration);
dayjs.locale('pt-br');

export default function IndexPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const code = router.query.code as string;

  const [parent] = useAutoAnimate(/* optional config */);

  const [gameState, setGame] = useState<Game | null>();
  trpc.room.read.useQuery(
    { code },
    {
      onSuccess(data) {
        setGame(data);
      },
    },
  );

  trpc.room.onAdd.useSubscription(
    { code },
    {
      onData(n) {
        setGame(n);
      },
    },
  );

  const game = gameState;

  const canStart = (game?.users.length ?? 0) > 2;

  const startMutation = trpc.room.start.useMutation();

  function start() {
    startMutation.mutateAsync({ code });
  }

  const nextMutation = trpc.room.next.useMutation();

  function nextAction() {
    nextMutation.mutateAsync({ code });
  }

  const jokerMutation = trpc.room.joker.useMutation();

  function jokerAction() {
    jokerMutation
      .mutateAsync({ code })
      .catch(() => toast.error('Você não pode usar o coringa agora!'));
  }

  useEffect(() => {
    if (game?.state === 'ENDED') {
      confetti();
    }
  }, [game?.state]);

  return (
    <>
      <Head>
        <title>CLARA DESIGN CIRCLE</title>
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <Layout>
        <Toaster />
        <section className="text-white">
          <div className="mx-auto max-w-screen-xl px-4 py-32 lg:h-screen lg:items-center">
            <div className="">
              <h1 className="text-2xl text-center flex justify-center gap-2">
                Jogo {game?.code}
                <button
                  className="border border-rose-500 bg-inherit p-1 rounded-md"
                  onClick={() => {
                    if (copyToClipboard(game?.code ?? '')) toast('Copiado');
                  }}
                >
                  ✂
                </button>
              </h1>
              {game?.state === 'LOBBY' && (
                <div className="max-w-sm mx-auto text-center flex flex-col">
                  <ul ref={parent} className="list-decimal my-5">
                    {game?.users.map((e) => (
                      <li key={e.id}>{e.name}</li>
                    ))}
                  </ul>
                  {game?.owner.id === session?.user?.email ? (
                    <Button
                      disabled={!canStart}
                      className={twMerge(
                        canStart ? '' : 'opacity-30 cursor-not-allowed',
                      )}
                      onClick={start}
                    >
                      Iniciar Jogo
                    </Button>
                  ) : (
                    <div className="space-y-4">
                      <p>Esperando o líder começar</p>
                      <RiseLoader color="hsla(339.6,82.2%,51.6%,1)" />
                    </div>
                  )}
                </div>
              )}
              {game?.state === 'STARTED' && (
                <div className="w-full">
                  <div className="flex justify-between w-full flex-col md:flex-row gap-2">
                    <div className="md:w-1/3 order-4 md:order-1">
                      <h3 className="text-center text-2xl my-4">
                        Minhas Cartas
                      </h3>
                      <div className="overflow-y-auto max-h-96 flex flex-col items-center gap-2">
                        {sort(
                          game.users.find((e) => e.id === session?.user?.email)
                            ?.cards ?? [],
                          (a) => a,
                        ).map((e) => (
                          <div key={e}>
                            <img src={`/cards/${e}.png`} className="w-60" />
                          </div>
                        ))}
                      </div>
                    </div>
                    <div className="md:w-1/3 flex justify-center flex-col items-center gap-2 order-2">
                      <img
                        src={`/cards/${game.actualAction.card}.png`}
                        className="w-72"
                      />
                      {session?.user?.email === game.actualAction.user.id && (
                        <Button className="sm:w-60" onClick={nextAction}>
                          Continuar
                        </Button>
                      )}
                    </div>
                    <div className="md:w-1/3 flex flex-col items-center order-3">
                      <ul ref={parent} className="space-y-3">
                        {game?.users.map((e) => (
                          <li
                            key={e.id}
                            className={twMerge(
                              'border-green-500 bg-gray-50 text-lg font-medium text-gray-900 w-56 px-2 py-1',
                              e.id === game.actualAction.user.id &&
                                'border-s-4 border-green-500',
                              first(game.gameAction)?.user.id === e.id &&
                                'border-s-4 border-yellow-400',
                            )}
                          >
                            {e.name}
                          </li>
                        ))}
                      </ul>
                      <p className="font-bold text-lg px-3">
                        🃏 {game.restingJokers} coringas restantes
                      </p>
                      <Button
                        className="border border-rose-500 bg-inherit sm:w-56 font-bold"
                        onClick={jokerAction}
                      >
                        Usar carta coringa
                      </Button>
                      <div className="w-56">
                        <Timer
                          start={game.actualAction.startedAt}
                          onFinish={() => {
                            if (
                              session?.user?.email === game.actualAction.user.id
                            ) {
                              toast.error('Acabou o tempo!!');
                            }
                          }}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}
              {game?.state === 'ENDED' && (
                <div className="flex flex-col items-center">
                  <h1 className="text-2xl text-center">Parabéns!</h1>
                  <Link href={'/'} className="underline">
                    Voltar para Inicio
                  </Link>
                </div>
              )}
            </div>
          </div>
        </section>
      </Layout>
    </>
  );
}

interface TimerProps {
  start: Date;
  onFinish?: () => void;
}
function Timer({ start, onFinish }: TimerProps) {
  const endTime = useMemo(
    () => dayjs(start).add(dayjs.duration(3, 'minutes')),
    [start],
  );

  const [time, setTime] = useState(endTime.diff(dayjs(), 'seconds'));
  const [parent] = useAutoAnimate(/* optional config */);

  useEffect(() => {
    const intervalId = setInterval(() => {
      setTime(endTime.diff(dayjs(), 'seconds'));
    }, 1000);

    return () => {
      clearInterval(intervalId);
    };
  }, [endTime]);

  useEffect(() => {
    if (time === 0) {
      onFinish?.();
    }
  }, [onFinish, time]);

  const minutes = Math.floor(time / 60);
  const seconds = time - minutes * 60;

  if (time < 0) {
    return <p className="text-center">Tempo finalizado!</p>;
  }

  return (
    <p className="text-center" ref={parent}>
      <span>🕗</span>
      <span>{String(minutes).padStart(2, '0')}</span>
      <span>:</span>
      <span>{String(seconds).padStart(2, '0')}</span>
      <span> Restante</span>
    </p>
  );
}
