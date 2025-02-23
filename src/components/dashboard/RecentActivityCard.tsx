import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import Link from "next/link";
import { redirect } from "next/navigation";
import HistoryComponent from "../HistoryComponent";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { db } from "@/lib/db";

type Props = {};

const RecentActivityCard = async (props: Props) => {
  const session = await auth.api.getSession({
    headers: await headers(), // you need to pass the headers object.
  });

  if (!session?.user) {
    return redirect("/");
  }
  // const games_count = await db.game.count({
  //   where: {
  //     userId: session.user.id,
  //   },
  // });

  const games = await db.query.games.findMany({
    where(fields, operators) {
      return operators.eq(fields.userId, session.user.id);
    },
  });

  const games_count = games.length;

  return (
    <Card className="col-span-4 lg:col-span-3">
      <CardHeader>
        <CardTitle className="text-2xl font-bold">
          <Link href="/history">Recent Activity</Link>
        </CardTitle>
        <CardDescription>
          You have played a total of {games_count} quizzes.
        </CardDescription>
      </CardHeader>
      <CardContent className="max-h-[580px] overflow-scroll">
        <HistoryComponent limit={10} userId={session.user.id} />
      </CardContent>
    </Card>
  );
};

export default RecentActivityCard;
