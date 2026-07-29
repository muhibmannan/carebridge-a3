const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export function required(value, label = "This field") {
  return value && String(value).trim() ? null : `${label} is required.`;
}

export function isEmail(value) {
  if (!value) return null;
  return EMAIL_PATTERN.test(String(value).trim())
    ? null
    : "Enter a valid email address, for example name@example.com.";
}

export function passwordStrength(value) {
  if (!value) return null;
  const rules = [
    [/.{8,}/, "at least 8 characters"],
    [/[A-Z]/, "an uppercase letter"],
    [/[a-z]/, "a lowercase letter"],
    [/[0-9]/, "a number"],
  ];
  const missing = rules
    .filter(([pattern]) => !pattern.test(value))
    .map(([, text]) => text);
  return missing.length ? `Password must contain ${missing.join(", ")}.` : null;
}

export function matches(value, otherValue, message = "Values do not match.") {
  if (!value) return null;
  return value === otherValue ? null : message;
}

export function notInPast(value, label = "Date") {
  if (!value) return null;
  const chosen = new Date(value);
  if (Number.isNaN(chosen.getTime())) return `${label} is not a valid date.`;
  return chosen.getTime() >= Date.now()
    ? null
    : `${label} cannot be in the past.`;
}

export const REGISTER_FIELDS = [
  "displayName",
  "email",
  "password",
  "confirmPassword",
];

export const FIELD_LABELS = {
  displayName: "Full name",
  email: "Email address",
  password: "Password",
  confirmPassword: "Confirm password",
};

export function validateRegisterForm(form) {
  const errors = {
    displayName:
      required(form.displayName, FIELD_LABELS.displayName) ||
      (form.displayName.trim().length < 2
        ? "Full name must be at least 2 characters."
        : null),

    email: required(form.email, FIELD_LABELS.email) || isEmail(form.email),

    password:
      required(form.password, FIELD_LABELS.password) ||
      passwordStrength(form.password),

    confirmPassword:
      required(form.confirmPassword, FIELD_LABELS.confirmPassword) ||
      matches(form.confirmPassword, form.password, "Passwords do not match."),
  };

  return Object.fromEntries(
    Object.entries(errors).filter(([, message]) => message !== null),
  );
}
