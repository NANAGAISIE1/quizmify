import { quizCreationSchema } from "@/schemas/forms/quiz";
import { NextResponse } from "next/server";
import { z } from "zod";
import axios from "axios";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { db } from "@/lib/db";
import { games, questions, topicCounts } from "@/db/schema";
import { eq, sql } from "drizzle-orm";

export async function POST(req: Request, res: Response) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(), // you need to pass the headers object.
    });
    if (!session?.user) {
      return NextResponse.json(
        { error: "You must be logged in to create a game." },
        {
          status: 401,
        },
      );
    }
    const body = await req.json();
    const { topic, type, amount } = quizCreationSchema.parse(body);

    const game = await db
      .insert(games)
      .values({
        gameType: type,
        timeStarted: new Date(),
        userId: session.user.id,
        topic,
      })
      .returning({ insertedId: games.id });

    await db
      .insert(topicCounts)
      .values({
        topic: topic,
        count: 1,
      })
      .onConflictDoUpdate({
        target: topicCounts.topic,
        set: {
          count: sql`${topicCounts.count} + 1`,
        },
      });

    const { data } = await axios.post(
      `${process.env.API_URL as string}/api/questions`,
      {
        amount,
        topic,
        type,
      },
    );

    if (type === "mcq") {
      type mcqQuestion = {
        question: string;
        answer: string;
        option1: string;
        option2: string;
        option3: string;
      };

      const manyData = data.questions.map((question: mcqQuestion) => {
        // mix up the options lol
        const options = [
          question.option1,
          question.option2,
          question.option3,
          question.answer,
        ].sort(() => Math.random() - 0.5);
        return {
          question: question.question,
          answer: question.answer,
          options: JSON.stringify(options),
          gameId: game[0].insertedId,
          questionType: "mcq",
        };
      });
      await db.batch([manyData]);
    } else if (type === "open_ended") {
      type openQuestion = {
        question: string;
        answer: string;
      };
      await db.insert(questions).values(
        data.questions.map((question: openQuestion) => ({
          question: question.question,
          answer: question.answer,
          gameId: game[0].insertedId,
          questionType: "open_ended",
        })),
      );
    }

    return NextResponse.json({ gameId: game[0].insertedId }, { status: 200 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.issues },
        {
          status: 400,
        },
      );
    } else {
      return NextResponse.json(
        { error: "An unexpected error occurred." },
        {
          status: 500,
        },
      );
    }
  }
}
export async function GET(req: Request, res: Response) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(), // you need to pass the headers object.
    });
    if (!session?.user) {
      return NextResponse.json(
        { error: "You must be logged in to create a game." },
        {
          status: 401,
        },
      );
    }
    const url = new URL(req.url);
    const gameId = url.searchParams.get("gameId");
    if (!gameId) {
      return NextResponse.json(
        { error: "You must provide a game id." },
        {
          status: 400,
        },
      );
    }

    const game = await db.query.games.findFirst({
      where: eq(games.id, gameId),
      with: {
        questions: true,
      },
    });

    // const game = await prisma.game.findUnique({
    //   where: {
    //     id: gameId,
    //   },
    //   include: {
    //     questions: true,
    //   },
    // });
    if (!game) {
      return NextResponse.json(
        { error: "Game not found." },
        {
          status: 404,
        },
      );
    }

    return NextResponse.json(
      { game },
      {
        status: 400,
      },
    );
  } catch (error) {
    return NextResponse.json(
      { error: "An unexpected error occurred." },
      {
        status: 500,
      },
    );
  }
}
