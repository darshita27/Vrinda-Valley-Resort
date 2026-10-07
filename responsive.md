# Responsive conventions used in this project

| Token | Mobile | Desktop |
|---|---|---|
| Section padding | `py-20` | `md:py-36` |
| Container padding | `px-5` | `sm:px-6` |
| Section heading | `text-[2rem]` | `md:text-[3.4rem]` |
| Body copy | `text-[15px]` | `md:text-base` |
| Card gap | `gap-5` | `md:gap-8` |

Mobile extras handled in `src/index.css`:
- `.lift:hover` disabled on touch (no sticky hover states)
- `.kenburns` animation disabled so the hero subject stays framed
- `input/select/textarea` forced to 16px to stop iOS auto-zoom
- `.display` gains weight on small screens for crisper rendering
