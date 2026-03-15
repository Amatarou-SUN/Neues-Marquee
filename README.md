# Neues-Marquee
The replacement for Marquee-Elements.
[Philosophy, etc.](http://yumezato-stt.f5.si/gallery/neues-marquee/)

## Summary
This script will revive the marquee without requiring any HTML modifications.
The attributes are (almost) identical to those of marquee.

## How to deploy
1. Place marquee.js on your server.
2. Add `<script src="/path/to/marquee.js"></script>` to the head section.
3. If you view the developer tools in a modern browser and see that the `neues-marquee` tag has been replaced, then you're done.

## Note: Side Effects
Due to the nature of the DOM reconstruction process, the following side effects occur:

* All `<marquee>` tags will be replaced with `<neues-marquee>` tags.
* DOM references will be invalidated after placement.

Example: `document.querySelectorAll("marquee");`, using DOM variables after placement.
Code using these behaviors that are affected by these side effects may not work.

(Inline scripts and events are largely unaffected.)

## Implemented Attributes & Functions
### Behavior Attribute
`scroll` (Default), `slide`, `alternate` Implemented
### Direction Attribute
`left` (Default), `right`, `up`, `down` Implemented
### Scrollamount Attribute
Implemented. Default: `6`
### Scrolldelay Attribute
Implemented. Default: `85`
### Loop Attribute
Implemented. Default: `-1`
### Width Attribute
Implemented. Default: Follows style
### Height Attribute
Implemented. Default: Follows style
### bgcolor Attribute
Implemented. Default: Follows style
### start()/stop() Function
Implemented.
`this.start()`, `this.stop()` Work

## Incomplete Attributes, Functions, Events
### onbounce Event
Implementation planned (timing TBD)
### RTL direction
Doesn't work correctly with Right to Left direction
Not Implemented yet (timing TBD)
### behavior=slide + direction=right
Known Issue (fix planned).

