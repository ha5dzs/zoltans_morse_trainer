# Zoltan's Morse trainer app

I needed a decent web app that helps with teaching Morse. For beginners, and to me, too, it is difficult to remember each character. Often, at normal (20-30 WPM) speeds, there is not enough time between characters to copy everything, and this makes receiving Morse unreliable. Adjusting the Farnsworth-timing, the gap between characters is a solution for training purposes, but it may not always be possible to get instant feedback whether the decoding was correct during a Morse class.

In this app, the user who receives is in control of the transmission, and feedback is available immediately after. This helps memorising the International Morse Code table because it makes it easier to identify difficult characters, and hopefully this will make future CW operators more profitient.

### How to use?

Press 'Start!' or `Enter`. You will hear a letter sent in Morse. Try guessing what it was. Press 'Reveal' or `Enter` to see if you were right. Repeat this process until you get really good at it. Increase the number of characters and speed and repeat until you get really-really good at it. Then you can try transmitting :).

## App controls
Key controls are implemented with the arrow keys:
  * `ArrowUp` and `ArrowDown` controls the speed.
  * `ArrowLeft` and `ArrowRight` controls the number of characters transmitted at a time.
  * `Enter` or a mouse click on 'Start!' or 'Reveal' transmits or shows what was transmitted, respecively.
  * 'Backspace' quits the app, and also saves the settings to local storage
  * Additionally, the numbers `4` and `6` can change the pitch of the beep.


That's it!

-------------------
(only read this bit of you are interested in how it does what it does.)

 # Why a web app?
 Besides me wanting to learn these things since Firefox OS came out in 2013, I like the appeal that a web app is more or less platform-independent by principle. This also makes it to be futureproof for the foreseeable future, as the only requirement to run it is an internet browser. These days, even a toaster has some form of an embedded system, and will probably be able to run a simple browser.
 Also, I like how KaiOS and GerdaOS devices are not only affordable but have a really good price-to-value ratio.

 ## How does it work?
  * The main display is the `index.html` file.
  * The `index.html` file is formatted via CSS, in `/css/app.css`
  * The `index.html` file also links `/js/app.js` where the main program is written.
  * Key presses and links are controlling the execution of various functions
  * To generate Morse code and to make sure the timing is precise, I am using the Web Audio API

Since this app is programmed in JavaScript, the main difficulty was to overcome the limitations of entry-level hardware. Due to the utopistic, asynchronous runtime model JavaScript has, it is surprisingly difficult to make something with precise timing:

### What did not work:
 * Flexible delay for a dot, dash and a gap
 At first, I thought when you put a bunch of `setTimeout()` statements in a for loop, I can slow down the execution of the for loop, and each statement will be executed in sequence. It doesn't: in the loop, all timers are started simultaneously.
 * Generate the dots and dashes from a sequence with unit-long beeps
 This worked, but I could hear how a dash is assembled from three unit beeps because of how much time it took to adjust the oscillator.
 * Pre-calculated delays for each symbol in the sequence, and generate a bunch of `setTimeout()`s with these delays
 Then, I calculated the times each dot and dash should start with respect to the beginning of the transmission.
    * Create an oscillator for each dot and dash
 All I had to do is to create the audio oscillator, and turn it on and off. Except that once you turn off an oscillator, you can't turn it back on again, you literally have to create the object again. This worked on a desktop computer, but had severe timing issues with the KaiOS device.
    * Create an oscillator, and adjust its frequency according to the dots and dashes
This worked, but the frequency adjustment wasn't continuous.
    * Create an oscillator, connect it to a gain node, and adjust the gain with `setTimeout()`
This improved timing, but it was way too unstable for this to work on a low-end device, above 5 WPM.
    * Create an oscillator, connect it to a gain node, and adjust its gain with `setGainAtTime()`
This worked better, but edges of the beeps were too clicky. I had to add the `linearRampToValueAtTime()` statements. This is not a perfect solution either, but it seems that the more human physiology-correct `exponentialRampToValueAtTime()` statements worked on the desktop, but not on KaiOS devices for some reason.

So, every time the app transmits, an oscillator is created, which is connected to a gain node, which is then connected to the output. At specific times according to the dots, dashes and gaps, I change the gain quickly, and this is how I make the beeps. Also, I have a small ramp that adjust the onset and decay of the beeps, to reduce the clicking sounds, which makes the beeps a bit softer. It's not perfect, and the quality of the output sound depends on the device it is running on. I have heard worse Morse oscillators before!

I left quite a bit of unused code in `js/app.js`, so feel free to look around.

## What devices were used for development?
A Nokia 8810 4G and an Energizer E241S for the device tests. I used a Linux virtual machine to run kaiosrt, and tunnelled the USB from my host system to so I can debug and load the app.