<script setup lang="ts">
/* Official Floofer wordmark. Still by default; `wagging` starts the tail.
   Drive it through useLogoWag() rather than binding this prop by hand, so
   every like in the app celebrates identically. */
withDefaults(defineProps<{ wagging?: boolean }>(), { wagging: false });
</script>

<template>
  <svg
    class="floofer-logo"
    viewBox="-50 -35 400 140"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    role="img"
    aria-label="floofer"
  >
    <path
      d="M73.5512 12.5255C73.5512 19.7914 68.738 22.632 61.2599 22.632C59.21 22.632 58.5951 22.4212 58.5951 21.1569C58.5951 16.5293 58.2917 13.6803 54.6018 13.6803C49.0753 13.6803 47.3288 20.9462 46.6154 28.3131H58.3901C59.415 28.3131 60.03 28.7346 60.03 29.7882L59.62 35.4694C59.3084 39.6839 57.9801 42.5245 51.8386 42.5245H45.5905C44.6721 54.9489 42.9256 76.2069 42.9256 76.8391C42.8272 78.5249 42.4172 78.9464 40.6707 78.9464H36.9808C29.6094 78.9464 27.0511 75.364 27.0511 68.2078C27.0511 66.4292 27.9612 54.165 28.773 42.7521L30.0112 27.4787L30.3391 24.0986C32.0857 5.8919 40.5805 0 54.61 0C68.6396 0 73.5512 5.3693 73.5512 12.5255ZM151.981 44.6318C151.981 57.8906 147.069 80 121.363 80C102.627 80 97.1989 68.3174 97.1989 53.6845C97.1989 36.7337 104.472 20.0021 127.915 20.0021C145.118 20.0021 151.981 29.0549 151.981 44.6318ZM134.573 45.2639C134.573 38.3184 132.22 34.0027 126.176 34.0027C115.837 34.0027 114.607 46.5283 114.607 52.5298C114.607 61.7933 117.575 65.9994 122.905 65.9994C132.531 65.9994 134.581 51.788 134.581 45.2639H134.573ZM210.141 44.6318C210.141 57.8906 205.229 80 179.523 80C160.787 80 155.359 68.3174 155.359 53.6845C155.359 36.7337 162.632 20.0021 186.075 20.0021C203.278 20.0021 210.141 29.0549 210.141 44.6318ZM192.733 45.2639C192.733 38.3184 190.38 34.0027 184.336 34.0027C173.997 34.0027 172.767 46.5283 172.767 52.5298C172.767 61.7933 175.735 65.9994 181.065 65.9994C190.691 65.9994 192.741 51.788 192.741 45.2639H192.733ZM248.745 28.3131H236.97C237.683 20.9462 239.43 13.6803 244.956 13.6803C248.646 13.6803 248.95 16.5209 248.95 21.1569C248.95 22.4212 249.564 22.632 251.614 22.632C259.092 22.632 263.906 19.7914 263.906 12.5255C263.906 5.25972 258.682 0 244.964 0C231.247 0 222.44 5.8919 220.694 24.107L220.284 28.3216C214.445 28.5323 213.732 32.2158 213.527 35.6885C213.429 37.7958 213.216 40.3161 213.216 41.3697C213.216 42.103 213.527 42.5245 214.339 42.5245H219.152C218.332 53.9964 217.414 66.4208 217.414 68.2078C217.414 75.364 219.972 78.9464 227.343 78.9464H231.033C232.772 78.9464 233.182 78.5249 233.288 76.8391C233.288 76.2069 235.027 54.9489 235.953 42.5245H242.201C248.343 42.5245 249.679 39.6839 249.983 35.4694L250.393 29.7882C250.393 28.7346 249.778 28.3131 248.753 28.3131H248.745ZM266.849 56.1037C266.849 61.473 269.613 66.8423 276.574 66.8423C283.536 66.8423 283.642 61.0515 286.504 61.0515C287.832 61.0515 294.285 62.2063 294.285 68.5281C294.285 76.738 283.331 80 274.213 80C262.331 80 249.228 74.5296 249.228 55.3704C249.228 44.7413 253.222 20.0021 279.641 20.0021C293.875 20.0021 298.893 27.1584 298.893 35.7897C298.893 55.05 273.499 56.1037 266.841 56.1037H266.849ZM281.387 39.4732C281.387 36.6326 279.649 34.0027 276.164 34.0027C270.121 34.0027 267.866 41.69 267.153 47.6831C275.549 47.5819 281.387 44.6318 281.387 39.4732ZM333.832 20.0021C329.429 20.0021 323.181 22.5308 320.008 29.0549C319.499 24.7392 317.244 21.0557 309.463 21.0557H305.47C304.346 21.0557 303.42 22.1094 303.321 24.107C301.173 55.05 300.246 64.6339 300.246 68.9495C300.246 75.3725 302.296 78.9464 310.693 78.9464H314.383C315.506 78.9464 316.637 78.213 316.637 76.8391C316.637 74.42 317.966 58.9443 318.581 50.0011C319.294 39.7935 321.959 34.6349 325.747 34.6349C328.207 34.6349 328.822 36.8433 328.822 39.8946C328.822 41.5804 328.617 43.0555 328.617 44.8425C328.617 45.8961 331.692 46.208 333.225 46.208C340.392 46.208 345 39.7851 345 32.2074C345 23.7867 339.162 19.9937 333.84 19.9937L333.832 20.0021Z"
      fill="currentColor"
    />
    <path
      d="M89.2125 60.3098C89.2125 52.3106 92.6973 18.4174 92.6973 10.098C92.6973 5.36087 90.2374 1.0452 82.046 1.0452H78.0528C77.1344 1.0452 76.7245 1.0452 76.4129 1.35708C76.1095 1.67738 76.0029 2.4107 75.9045 4.09651C73.4446 49.0401 71.6079 59.7787 71.6079 64.9373C71.6079 75.5663 75.0927 79.882 83.4892 79.882C93.0089 79.882 95.3704 73.3579 95.3704 67.1457C95.3704 65.6706 89.2289 67.4576 89.2289 60.3013L89.2125 60.3098Z"
      transform="translate(2 0) skewX(-5)"
      fill="currentColor"
    />
    <g class="floofer-logo__tail" :class="{ 'is-wagging': wagging }">
      <path
        d="M28.773 42.7521C17.09 44.202 1.54 38.212 0.107 24.754L7.2954 22.4541C11.0487 27.3247 17.7798 28.11 30.0112 27.4787C32.2 27.35 34.2 25.4 34.6 22.8L35 23.2L38 27L37 44Z"
        fill="currentColor"
      />
      <path
        class="floofer-logo__tail-tip"
        d="M0.107 24.754C-0.251 21.389 0.273 17.558 1.96021 13.2589C2.3456 12.2811 3.71493 12.6941 3.91173 13.7309C4.6251 17.529 5.6868 20.3667 7.2954 22.4541L8.5 26.5L4.5 30.5L1.5 29Z"
        fill="currentColor"
      />
    </g>
  </svg>
</template>

<style scoped>
.floofer-logo {
  display: block;
  width: 100%;
  height: auto;
  /* Official mark colour by default; any parent can retheme it by setting
     --floofer-ink (the header matches it to the app's brand token). */
  color: var(--floofer-ink, #4c5fe4);
}
/* Pivot is baked into the keyframes (translate sandwich around 34,33 in
   viewBox user units) so it behaves identically in every browser. */
@keyframes floofer-tail-wag {
  0%   { transform: translate(34px, 33px) rotate(0deg)   translate(-34px, -33px); }
  12%  { transform: translate(34px, 33px) rotate(18deg)  translate(-34px, -33px); }
  28%  { transform: translate(34px, 33px) rotate(-16deg) translate(-34px, -33px); }
  44%  { transform: translate(34px, 33px) rotate(15deg)  translate(-34px, -33px); }
  60%  { transform: translate(34px, 33px) rotate(-11deg) translate(-34px, -33px); }
  76%  { transform: translate(34px, 33px) rotate(7deg)   translate(-34px, -33px); }
  90%  { transform: translate(34px, 33px) rotate(-3deg)  translate(-34px, -33px); }
  100% { transform: translate(34px, 33px) rotate(0deg)   translate(-34px, -33px); }
}
.floofer-logo__tail,
.floofer-logo__tail-tip {
  transition: transform 0.45s ease-out; /* smooth settle back to rest */
}
.floofer-logo__tail.is-wagging {
  animation: floofer-tail-wag 1.15s cubic-bezier(0.45, 0.05, 0.55, 0.95) infinite;
}
/* Tip follow-through: same wave, smaller amplitude, ~90ms phase lag. */
@keyframes floofer-tip-wag {
  0%   { transform: translate(3.7px, 23.6px) rotate(0deg)    translate(-3.7px, -23.6px); }
  12%  { transform: translate(3.7px, 23.6px) rotate(8deg)    translate(-3.7px, -23.6px); }
  28%  { transform: translate(3.7px, 23.6px) rotate(-7.5deg) translate(-3.7px, -23.6px); }
  44%  { transform: translate(3.7px, 23.6px) rotate(7deg)    translate(-3.7px, -23.6px); }
  60%  { transform: translate(3.7px, 23.6px) rotate(-5deg)   translate(-3.7px, -23.6px); }
  76%  { transform: translate(3.7px, 23.6px) rotate(3deg)    translate(-3.7px, -23.6px); }
  90%  { transform: translate(3.7px, 23.6px) rotate(-1.5deg) translate(-3.7px, -23.6px); }
  100% { transform: translate(3.7px, 23.6px) rotate(0deg)    translate(-3.7px, -23.6px); }
}
.is-wagging .floofer-logo__tail-tip {
  animation: floofer-tip-wag 1.15s cubic-bezier(0.45, 0.05, 0.55, 0.95) infinite;
  animation-delay: -1.06s;
}
@media (prefers-reduced-motion: reduce) {
  .floofer-logo__tail,
  .floofer-logo__tail-tip { animation: none; }
}
</style>
