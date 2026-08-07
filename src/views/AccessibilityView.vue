<script setup>
const lastReviewed = "August 2026";
</script>

<template>
  <div class="statement">
    <div class="container">
      <header class="statement-header">
        <h1>Accessibility statement</h1>
        <p class="statement-lead">
          Enable Collective builds CareBridge for people living with
          disabilities, so accessibility is a requirement of the product rather
          than an afterthought. This page sets out what we aim for, what we have
          tested, and where we know we fall short.
        </p>
        <p class="statement-meta">Last reviewed {{ lastReviewed }}</p>
      </header>

      <section aria-labelledby="conformance-heading">
        <h2 id="conformance-heading">Conformance target</h2>
        <p>
          CareBridge aims to meet
          <a
            href="https://www.w3.org/TR/WCAG21/"
            rel="noopener noreferrer"
            target="_blank"
          >
            Web Content Accessibility Guidelines (WCAG) 2.1 Level AA<span
              class="visually-hidden"
            >
              (opens in a new tab)</span
            ></a
          >. Level AA is the standard referenced by Australian government
          digital service requirements and is the level most assistive
          technology users expect.
        </p>
      </section>

      <section aria-labelledby="measures-heading">
        <h2 id="measures-heading">What we have built in</h2>
        <ul class="statement-list">
          <li>
            Every page can be operated by keyboard alone, including the booking
            calendar, admin tables and modal dialogs. Focus is visible on every
            interactive element and is never removed.
          </li>
          <li>
            A skip link is the first focusable element on each page, and content
            sits inside semantic landmarks with a single level-one heading.
          </li>
          <li>
            Text colour meets a contrast ratio of at least 4.5:1 against its
            background, and interface components and large text meet 3:1.
          </li>
          <li>
            Status is never carried by colour alone - badges and validation
            messages pair colour with an icon and a text label.
          </li>
          <li>
            Form fields have associated labels, and validation errors are
            specific, linked to their field, and announced to screen readers.
          </li>
          <li>
            Charts are accompanied by the same figures in text or table form.
          </li>
          <li>
            Animation is removed for anyone whose system requests reduced
            motion.
          </li>
        </ul>
      </section>

      <section aria-labelledby="limits-heading">
        <h2 id="limits-heading">Known limitations</h2>
        <p>
          We would rather name these than imply full coverage we cannot yet
          evidence.
        </p>
        <ul class="statement-list">
          <li>
            The services map relies on a third-party mapping library. Its
            controls are keyboard operable, but the map canvas itself is visual;
            search results and directions are also presented as text so the
            information is available without the map.
          </li>
          <li>
            Documents linked from the resource library are published by external
            organisations and their accessibility is outside our control.
          </li>
          <li>
            Testing has covered keyboard navigation, automated audits and
            screen-reader spot checks. It has not yet included a full audit with
            a range of assistive technology users.
          </li>
        </ul>
      </section>

      <section aria-labelledby="feedback-heading">
        <h2 id="feedback-heading">Tell us if something blocks you</h2>
        <p>
          If any part of CareBridge is difficult or impossible for you to use,
          contact us and describe what you were trying to do. We treat access
          barriers as faults and prioritise them accordingly.
        </p>
        <p>
          Email
          <a href="mailto:hello@enablecollective.org.au"
            >hello@enablecollective.org.au</a
          >
          or write to Enable Collective, 42 Carlton St, Melbourne VIC 3053.
        </p>
      </section>
    </div>
  </div>
</template>

<style scoped lang="scss">
.statement {
  padding-block: 3rem 4rem;
  background: #ffffff;
}

.container {
  max-width: 720px;
}

.statement-header {
  margin-bottom: 2.5rem;
}

h1 {
  font-family: "Poppins", sans-serif;
  font-weight: 700;
  font-size: 2rem;
  color: #101828;
  margin-bottom: 1rem;
}

h2 {
  font-family: "Poppins", sans-serif;
  font-weight: 600;
  font-size: 1.25rem;
  color: #101828;
  margin-bottom: 0.75rem;
}

section {
  margin-bottom: 2.25rem;
}

p {
  color: #4a5565;
  font-size: 1rem;
  line-height: 1.7;
}

.statement-lead {
  font-size: 1.0625rem;
  color: #364153;
}

.statement-meta {
  color: #6a7282;
  font-size: 0.875rem;
  margin-bottom: 0;
}

.statement-list {
  color: #4a5565;
  line-height: 1.7;
  padding-left: 1.25rem;

  li {
    margin-bottom: 0.6rem;
  }
}

a {
  color: #1447e6;

  &:hover {
    text-decoration: underline;
  }

  &:focus-visible {
    outline: 3px solid #2f80ed;
    outline-offset: 2px;
  }
}
</style>