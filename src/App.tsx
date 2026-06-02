import { animate, stagger } from "animejs";
import {
  ArrowDown,
  CalendarHeart,
  Camera,
  CheckCircle2,
  Heart,
  Sparkles,
  X,
} from "lucide-react";
import { useEffect, useState } from "react";
import { Badge } from "./components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "./components/ui/card";
import { tribute, type Message, type TributeImage } from "./content/tribute";

type ViewerState =
  | { kind: "image"; image: TributeImage }
  | { kind: "message"; message: Message }
  | null;

function assetPath(path: string) {
  return `${import.meta.env.BASE_URL}${path.replace(/^\/+/, "")}`;
}

function scrollToId(id: string) {
  document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
}

function imageFromPath(src: string): TributeImage {
  const name = src
    .split("/")
    .pop()
    ?.replace(/\.[^.]+$/, "")
    .replace(/[-_]+/g, " ")
    .trim();

  return {
    src,
    alt: name ? `${name} photo` : "Timeline photo",
    caption: "",
  };
}

function buildRiverPath(rowCount: number) {
  const rowHeight = 420;
  const viewBoxHeight = Math.max(rowHeight, rowCount * rowHeight);
  const curves = Array.from({ length: rowCount }, (_, index) => {
    const startY = index * rowHeight;
    const endY = (index + 1) * rowHeight;
    const bend = index % 2 === 0 ? -68 : 68;

    return `C${120 + bend} ${startY + 140} ${120 + bend} ${
      startY + 280
    } 120 ${endY}`;
  });

  return {
    path: `M120 0 ${curves.join(" ")}`,
    viewBoxHeight,
  };
}

function useTributeAnimations() {
  useEffect(() => {
    const reduceMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;

    if (reduceMotion) {
      return;
    }

    animate(".hero-motion", {
      opacity: [0, 1],
      translateY: [18, 0],
      duration: 900,
      delay: stagger(90),
      ease: "out(3)",
    });

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) {
            return;
          }

          const isMemoryStop = entry.target.classList.contains("memory-stop");

          animate(entry.target, {
            opacity: [0, 1],
            translateY: isMemoryStop ? [42, 0] : [24, 0],
            scale: isMemoryStop ? [0.97, 1] : [1, 1],
            duration: isMemoryStop ? 920 : 780,
            ease: "out(3)",
          });

          if (isMemoryStop) {
            animate(entry.target.querySelectorAll(".memory-photo"), {
              opacity: [0, 1],
              translateY: [34, 0],
              rotate: [-1.6, 0],
              duration: 860,
              delay: stagger(90),
              ease: "out(3)",
            });
          }

          observer.unobserve(entry.target);
        });
      },
      { threshold: 0.18 },
    );

    document.querySelectorAll(".reveal-motion").forEach((element) => {
      observer.observe(element);
    });

    document
      .querySelectorAll<SVGPathElement>(".river-flow, .river-mouth-flow")
      .forEach((flow) => {
        animate(flow, {
          strokeDashoffset: [0, -96],
          duration: 3600,
          loop: true,
          ease: "linear",
        });
      });

    animate(".ocean-swell", {
      translateX: [-28, 28],
      duration: 5200,
      alternate: true,
      loop: true,
      ease: "inOut(2)",
    });

    animate(".ocean-glint", {
      opacity: [0.2, 0.55],
      translateY: [8, -6],
      duration: 2600,
      delay: stagger(180),
      alternate: true,
      loop: true,
      ease: "inOut(2)",
    });

    const riverPaths = Array.from(
      document.querySelectorAll<SVGPathElement>(".river-draw"),
    );
    const section = document.querySelector<HTMLElement>(".memory-path");

    if (riverPaths.length === 0 || !section) {
      return () => observer.disconnect();
    }

    const pathLengths = riverPaths.map((riverPath) => {
      const totalLength = riverPath.getTotalLength();
      riverPath.style.strokeDasharray = `${totalLength}`;
      riverPath.style.strokeDashoffset = `${totalLength}`;
      return totalLength;
    });

    let latestProgress = -1;
    let ticking = false;

    const drawPath = () => {
      const rect = section.getBoundingClientRect();
      const viewportHeight = window.innerHeight;
      const start = viewportHeight * 0.58;
      const finish = viewportHeight * 0.42;
      const travelDistance = Math.max(rect.height - (start - finish), 1);
      const riverDrawSpeed = 1.45;
      const rawProgress = ((start - rect.top) / travelDistance) * riverDrawSpeed;
      const progress = Math.min(Math.max(rawProgress, 0), 1);

      if (Math.abs(progress - latestProgress) > 0.006) {
        latestProgress = progress;
        riverPaths.forEach((riverPath, index) => {
          animate(riverPath, {
            strokeDashoffset: pathLengths[index] * (1 - progress),
            duration: 320,
            ease: "out(2)",
          });
        });
      }

      ticking = false;
    };

    const onScroll = () => {
      if (!ticking) {
        ticking = true;
        window.requestAnimationFrame(drawPath);
      }
    };

    drawPath();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);

    return () => {
      observer.disconnect();
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, []);
}

function PhotoFrame({
  image,
  onOpen,
}: {
  image: TributeImage;
  onOpen?: (image: TributeImage) => void;
}) {
  return (
    <button
      type="button"
      className="photo-frame group"
      onClick={() => onOpen?.(image)}
      onMouseEnter={(event) => {
        animate(event.currentTarget, {
          scale: 1.015,
          duration: 220,
          ease: "out(2)",
        });
      }}
      onMouseLeave={(event) => {
        animate(event.currentTarget, {
          scale: 1,
          duration: 220,
          ease: "out(2)",
        });
      }}
    >
      <img
        src={assetPath(image.src)}
        alt={image.alt}
        loading="eager"
        decoding="async"
      />
      
    </button>
  );
}

function TributeViewer({
  viewer,
  onClose,
}: {
  viewer: ViewerState;
  onClose: () => void;
}) {
  useEffect(() => {
    if (!viewer) {
      return;
    }

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKeyDown);

    animate(".tribute-modal-panel", {
      opacity: [0, 1],
      translateY: [18, 0],
      scale: [0.98, 1],
      duration: 280,
      ease: "out(3)",
    });

    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [onClose, viewer]);

  if (!viewer) {
    return null;
  }

  return (
    <div className="tribute-modal" role="dialog" aria-modal="true">
      <button
        type="button"
        className="tribute-modal-backdrop"
        aria-label="Close viewer"
        onClick={onClose}
      />
      <div className={`tribute-modal-panel ${viewer.kind}`}>
        <button
          type="button"
          className="tribute-modal-close"
          aria-label="Close"
          onClick={onClose}
        >
          <X aria-hidden="true" size={22} />
        </button>

        {viewer.kind === "image" ? (
          <>
            <img
              src={assetPath(viewer.image.src)}
              alt={viewer.image.alt}
              className="tribute-modal-image"
            />
          </>
        ) : (
          <article className="tribute-modal-message">
            <Badge>{viewer.message.relation ?? "With love"}</Badge>
            <h3>{viewer.message.from}</h3>
            <p>{viewer.message.body}</p>
          </article>
        )}
      </div>
    </div>
  );
}

function Hero({ onOpenImage }: { onOpenImage: (image: TributeImage) => void }) {
  const { hero } = tribute;

  return (
    <header className="hero-section">
      <div className="hero-grid">
        <div className="hero-copy">
          <Badge className="hero-motion">
            <CalendarHeart aria-hidden="true" size={14} />
            Retirement Tribute
          </Badge>
          <h1 className="hero-motion">{hero.name}</h1>
          <p className="hero-motion hero-subtitle">{hero.subtitle}</p>
          <p className="hero-motion hero-line">{hero.dateLabel}</p>
          {/* <div className="hero-motion hero-actions">
            <Button type="button" onClick={() => scrollToId("years")}>
              <Images aria-hidden="true" size={18} />
              Through the years
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => scrollToId("messages")}
            >
              <Mail aria-hidden="true" size={18} />
              Read messages
            </Button>
          </div> */}
        </div>

        <div className="hero-image hero-motion">
          <PhotoFrame image={hero.image} onOpen={onOpenImage} />
        </div>
      </div>

      <button
        type="button"
        className="scroll-cue hero-motion"
        aria-label="Scroll to tribute"
        onClick={() => scrollToId("intro")}
      >
        <ArrowDown aria-hidden="true" size={18} />
      </button>
    </header>
  );
}

function Intro() {
  const { intro } = tribute;

  return (
    <section id="intro" className="intro-section reveal-motion">
      <div className="section-kicker">
        <Sparkles aria-hidden="true" size={18} />
        {intro.eyebrow}
      </div>
      <h2>{intro.title}</h2>
      <p>{intro.body}</p>
    </section>
  );
}

function Timeline({ onOpenImage }: { onOpenImage: (image: TributeImage) => void }) {
  const timelineImages = tribute.timelineEntries.map(imageFromPath);
  const imagePairs = Array.from(
    { length: Math.ceil(timelineImages.length / 2) },
    (_, index) => timelineImages.slice(index * 2, index * 2 + 2),
  );
  const river = buildRiverPath(Math.max(imagePairs.length, 1));

  return (
    <section id="years" className="timeline-section">
      <div className="section-heading reveal-motion">
        <div className="section-kicker">
          <Camera aria-hidden="true" size={18} />
          Through the years
        </div>
        <h2>A life to remember</h2>
      </div>

      <div className="memory-path">
        <svg
          className="river-line"
          viewBox={`0 0 240 ${river.viewBoxHeight}`}
          preserveAspectRatio="none"
          aria-hidden="true"
        >
          <defs>
            <linearGradient id="river-gradient" x1="0" x2="0" y1="0" y2="1">
              <stop offset="0%" stopColor="#7ec8d8" />
              <stop offset="48%" stopColor="#2f8fb0" />
              <stop offset="100%" stopColor="#1f6f9d" />
            </linearGradient>
          </defs>
          <path
            className="river-bank"
            d={river.path}
          />
          <path
            className="river-draw"
            d={river.path}
          />
          <path
            className="river-flow river-flow-a"
            d={river.path}
          />
          <path
            className="river-flow river-flow-b"
            d={river.path}
          />
        </svg>

        {imagePairs.map((pair) => (
          <article
            className="memory-stop reveal-motion"
            key={pair.map((image) => image.src).join("-")}
          >
            {pair.map((image, imageIndex) => (
              <div
                className={`memory-photo ${
                  imageIndex === 0 ? "is-left" : "is-right"
                }`}
                key={`${image.src}-${imageIndex}`}
              >
                <PhotoFrame image={image} onOpen={onOpenImage} />
              </div>
            ))}
          </article>
        ))}
      </div>
    </section>
  );
}

function Messages({ onOpenMessage }: { onOpenMessage: (message: Message) => void }) {
  return (
    <section id="messages" className="messages-section">
      <div className="ocean-field" aria-hidden="true">
        <svg
          className="river-mouth"
          viewBox="0 0 1200 520"
          preserveAspectRatio="none"
        >
          <defs>
            <linearGradient id="river-mouth-gradient" x1="0.5" x2="0.5" y1="0" y2="1">
              <stop offset="0%" stopColor="#1f8cb3" stopOpacity="0.9" />
              <stop offset="48%" stopColor="#63bfd1" stopOpacity="0.48" />
              <stop offset="100%" stopColor="#b9e3e8" stopOpacity="0" />
            </linearGradient>
          </defs>
          <path
            className="river-mouth-water"
            d="M586 0 C552 82 410 190 116 520 H1084 C790 190 648 82 614 0 C608 8 592 8 586 0 Z"
          />
          <path
            className="river-mouth-flow river-mouth-flow-a"
            d="M600 12 C586 126 562 282 520 500"
          />
          <path
            className="river-mouth-flow river-mouth-flow-b"
            d="M594 18 C514 146 410 288 250 500"
          />
          <path
            className="river-mouth-flow river-mouth-flow-c"
            d="M606 18 C686 146 790 288 950 500"
          />
        </svg>
        <span className="ocean-swell ocean-swell-a" />
        <span className="ocean-swell ocean-swell-b" />
        <span className="ocean-swell ocean-swell-c" />
        <span className="ocean-glint ocean-glint-a" />
        <span className="ocean-glint ocean-glint-b" />
        <span className="ocean-glint ocean-glint-c" />
      </div>
      <div className="section-heading reveal-motion">
        <div className="section-kicker">
          <Heart aria-hidden="true" size={18} />
          Heartfelt messages
        </div>
        <h2>Words for the person who gave us so much</h2>
      </div>

      <div className="message-grid">
        {tribute.messages.map((message) => (
          <button
            type="button"
            className="message-card-button reveal-motion"
            key={message.from}
            onClick={() => onOpenMessage(message)}
          >
            <Card className="message-card">
              <CardHeader>
                <Badge>{message.relation ?? "With love"}</Badge>
                <CardTitle>{message.from}</CardTitle>
              </CardHeader>
              <CardContent>
                <p>{message.body}</p>
                <span className="read-more">Read full message</span>
              </CardContent>
            </Card>
          </button>
        ))}
      </div>
    </section>
  );
}

function Closing({ onOpenImage }: { onOpenImage: (image: TributeImage) => void }) {
  const { closing } = tribute;

  return (
    <section id="closing" className="closing-section reveal-motion">
      <PhotoFrame image={closing.image} onOpen={onOpenImage} />
      <div>
        <div className="section-kicker">
          <Heart aria-hidden="true" size={18} />
          {closing.title}
        </div>
        <p>{closing.body}</p>
        <div className="bucket-list" aria-labelledby="bucket-list-title">
          <h2 id="bucket-list-title">{closing.bucketListTitle}</h2>
          <ul>
            {closing.bucketList.map((item) => (
              <li key={item}>
                <CheckCircle2 aria-hidden="true" size={18} />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>
        <p className="family-signature">{closing.signature}</p>
      </div>
    </section>
  );
}

export default function App() {
  const [viewer, setViewer] = useState<ViewerState>(null);
  useTributeAnimations();

  return (
    <main>
      <Hero onOpenImage={(image) => setViewer({ kind: "image", image })} />
      <Intro />
      <Timeline onOpenImage={(image) => setViewer({ kind: "image", image })} />
      <Messages onOpenMessage={(message) => setViewer({ kind: "message", message })} />
      <Closing onOpenImage={(image) => setViewer({ kind: "image", image })} />
      <TributeViewer viewer={viewer} onClose={() => setViewer(null)} />
    </main>
  );
}
