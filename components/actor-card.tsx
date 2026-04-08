"use client";

import Image from "next/image";
import { User } from "lucide-react";

export interface ActorCardData {
  id: number;
  name: string;
  profileUrl: string | null;
  knownForDepartment: string;
  knownFor: string[];
}

interface ActorCardProps {
  actor: ActorCardData;
  onClick: (actor: ActorCardData) => void;
}

export function ActorCard({ actor, onClick }: ActorCardProps) {
  return (
    <button
      onClick={() => onClick(actor)}
      className="group flex flex-col items-center gap-2 text-center focus:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-lg p-2 transition-opacity hover:opacity-90"
    >
      <div className="relative w-full aspect-[2/3] rounded-lg overflow-hidden bg-muted">
        {actor.profileUrl ? (
          <Image
            src={actor.profileUrl}
            alt={actor.name}
            fill
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 20vw"
            className="object-cover transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <User className="h-12 w-12 text-muted-foreground" />
          </div>
        )}
      </div>

      <div className="w-full space-y-0.5 px-1">
        <p className="font-medium text-sm leading-tight line-clamp-2">{actor.name}</p>
        {actor.knownFor.length > 0 && (
          <p className="text-xs text-muted-foreground line-clamp-1">
            {actor.knownFor.join(", ")}
          </p>
        )}
      </div>
    </button>
  );
}
