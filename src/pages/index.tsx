import { Button } from 'components/button';
import { Layout } from 'components/layout';
import { RedirectableProviderType } from 'next-auth/providers';
import { signIn, useSession } from 'next-auth/react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { useState } from 'react';
import { trpc } from 'utils/trpc';

export default function IndexPage() {
  const { data: session } = useSession();

  const [name, setName] = useState('');
  const [code, setCode] = useState('');

  const addRoom = trpc.room.add.useMutation();
  const router = useRouter();

  async function startGame() {
    if (!session?.user?.name) return;

    const game = await addRoom.mutateAsync({
      code,
    });

    router.push(`game/${game.code}`);
  }

  return (
    <>
      <Head>
        <title>CLARA DESIGN CIRCLE</title>
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <Layout>
        <section className="text-white h-screen">
          <div className="mx-auto max-w-screen-xl px-4 py-32 lg:flex lg:h-screen lg:items-center">
            <div className="mx-auto max-w-3xl text-center">
              <h1 className="bg-gradient-to-r from-green-300 via-blue-500 to-purple-600 bg-clip-text text-3xl font-extrabold text-transparent sm:text-5xl space-y-2">
                CLARA DESIGN CIRCLE
              </h1>

              <p className="mx-auto mt-4 max-w-xl sm:text-xl/relaxed">
                Um Jogo para descascar os abacaxis 🍍
              </p>

              <form
                className="sm:flex sm:gap-4 mt-8"
                onSubmit={async (e) => {
                  e.preventDefault();

                  await signIn<RedirectableProviderType>('credentials', {
                    name,
                  });
                }}
              >
                <div className="sm:flex-1">
                  <label htmlFor="name" className="sr-only">
                    Nome
                  </label>

                  <input
                    value={
                      session?.user?.name ? session.user?.name ?? '' : name
                    }
                    onChange={(e) => setName(e.target.value)}
                    id="name"
                    name="name"
                    type="text"
                    placeholder="Nome"
                    className="w-full rounded-md border-gray-200 bg-white p-3 text-gray-700 shadow-sm transition focus:border-white focus:outline-none focus:ring focus:ring-yellow-400"
                  />
                </div>

                <Button
                  type="submit"
                  className="border border-rose-600 bg-inherit"
                >
                  Entrar
                </Button>
              </form>

              <form
                className="sm:flex sm:gap-4 mt-8"
                onSubmit={async (e) => {
                  e.preventDefault();

                  startGame();
                }}
              >
                <div className="sm:flex-1">
                  <label htmlFor="room" className="sr-only">
                    Código da Sala
                  </label>

                  <input
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    id="room"
                    name="room"
                    type="text"
                    placeholder="Código da Sala"
                    className="w-full rounded-md border-gray-200 bg-white p-3 text-gray-700 shadow-sm transition focus:border-white focus:outline-none focus:ring focus:ring-yellow-400"
                  />
                </div>

                <Button type="submit">
                  <span className="text-sm font-medium">Jogar</span>
                  <svg
                    className="h-5 w-5 rtl:rotate-180"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M17 8l4 4m0 0l-4 4m4-4H3"
                    />
                  </svg>
                </Button>
              </form>
              {/* <div className="mt-8 flex flex-wrap justify-center gap-4">
                <a
                  className="block w-full rounded border border-blue-600 bg-blue-600 px-12 py-3 text-sm font-medium text-white hover:bg-transparent hover:text-white focus:outline-none focus:ring active:text-opacity-75 sm:w-auto"
                  href="/get-started"
                >
                  Get Started
                </a>

                <a
                  className="block w-full rounded border border-blue-600 px-12 py-3 text-sm font-medium text-white hover:bg-blue-600 focus:outline-none focus:ring active:bg-blue-500 sm:w-auto"
                  href="/about"
                >
                  Learn More
                </a>
              </div> */}
            </div>
          </div>
        </section>
      </Layout>
    </>
  );
}
