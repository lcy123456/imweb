import clsx from "clsx";
import { memo, useEffect, useState } from "react";

const AlphabetIndex = ({ indexList }: { indexList: string[] }) => {
  const [currentAlphabet, setCurrentAlphabet] = useState("");

  useEffect(() => {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        const top = entry.target.getBoundingClientRect().top;
        if (top < 130 && top > 0) {
          setCurrentAlphabet(String(entry.target.textContent));
        }
      });
    });

    const wrapEl = document.getElementById("alphabet-wrap");
    if (wrapEl) {
      const dividers = wrapEl.querySelectorAll(".my-alphabet");
      dividers.forEach((divider) => {
        observer.observe(divider);
      });
    }
    return () => {
      observer.disconnect();
    };
  }, [indexList]);

  const handleClick = (letter: string) => {
    const wrapEl = document.getElementById("alphabet-wrap");
    const el = document.getElementById(`letter${letter}`);
    wrapEl?.scrollTo({ top: el?.offsetTop, behavior: "smooth" });
    setCurrentAlphabet(letter);
  };

  return (
    <div className="top-30 absolute right-0 flex flex-col items-center p-3">
      {indexList.map((letter) => {
        return (
          <span
            className={clsx("my-0.5 cursor-pointer text-xs text-[#8E9AB0]", {
              "!text-[#0289FAFF]": currentAlphabet === letter,
            })}
            key={letter}
            onClick={() => handleClick(letter)}
          >
            {letter}
          </span>
        );
      })}
    </div>
  );
};

export default memo(AlphabetIndex);
