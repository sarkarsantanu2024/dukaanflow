'use client';

/**
 * SIMPLE MODE — the app with one job on the screen at a time.
 *
 * THE PROBLEM IT SOLVES, in the words it was reported in: owners shown the app
 * said the screens were too busy, that there were too many options in one
 * place, and that they could not work out what the product was for. Every one
 * of those complaints is the same complaint, and it is not a complaint about
 * any individual control.
 *
 * Count what the Items tab puts in front of a shopkeeper on their first
 * morning: a search box, a category filter, a select-all row, a delete-
 * everything button, a tick box on every item, an editable name, a price, a
 * pack size, an in/out switch, a stock counter, a trash can, a strip of
 * suggested items inside every section, an unpriced warning, a duplicate-name
 * warning, a common-items picker, a customer notice card, a delivery-terms
 * card, a plan-limit card, a camera button and a microphone. Each one was added
 * for a good reason and can be defended on its own. Together they are the
 * reason an owner puts the phone down.
 *
 * THE RULE THIS FILE ENFORCES: nothing is deleted, and nothing is dumbed down.
 * Simple mode changes WHEN an owner meets a control, not whether the control
 * exists. Everything hidden is one tap away behind a labelled way in, and the
 * switch back to the full app is on every screen. A shopkeeper who has listed
 * forty items and wants their delivery terms will find them; a shopkeeper on
 * day one is not asked to step over them to reach the mic.
 *
 * WHY THE DEFAULT IS SIMPLE. The owners who are lost are the ones who have
 * never seen it, and they are exactly the ones who will never find a setting
 * that turns the noise down. An owner who wants everything can say so once.
 *
 * WHY THE PHONE REMEMBERS RATHER THAN THE SERVER. This is a preference about a
 * screen, not a fact about a shop — and it had to ship for this week's demos
 * without a schema change against a database that local development still
 * writes to directly. The cost is that it does not follow an owner to a second
 * phone, which for a shopkeeper with one phone in one shop is not a cost. If
 * the Super Admin ever needs to set it from the console it moves onto `Shop`;
 * everything above this line stays true when it does.
 */

const KEY = 'halkhata:simple';

/**
 * Per shop, not per phone. A demo phone carries four shops and an operator
 * walking one owner through the full app must not turn the training wheels off
 * for the other three.
 */
function keyFor(slug: string): string {
  return `${KEY}:${slug}`;
}

export function readSimpleMode(slug: string): boolean {
  try {
    const stored = window.localStorage.getItem(keyFor(slug));
    // No answer means the owner has never been asked, and an owner who has
    // never been asked gets the quiet screen. See "WHY THE DEFAULT IS SIMPLE".
    return stored === null ? true : stored === '1';
  } catch {
    // Private mode, blocked site data, a browser that throws on storage — all
    // land here, and all of them mean "nobody told us otherwise".
    return true;
  }
}

export function writeSimpleMode(slug: string, simple: boolean): void {
  try {
    window.localStorage.setItem(keyFor(slug), simple ? '1' : '0');
  } catch {
    /* A preference that cannot be saved is still a preference for this visit. */
  }
}
