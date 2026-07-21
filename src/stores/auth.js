import { defineStore } from "pinia";
import { ref, computed } from "vue";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  updateProfile,
} from "firebase/auth";
import { doc, setDoc, getDoc, serverTimestamp } from "firebase/firestore";
import { auth, db } from "@/firebase";

export const useAuthStore = defineStore("auth", () => {
  const user = ref(null);
  const profile = ref(null);
  const initialised = ref(false);
  const loading = ref(false);
  const error = ref(null);

  const isAuthenticated = computed(() => !!user.value);
  const role = computed(() => profile.value?.role ?? null);
  const isAdmin = computed(() => role.value === "admin");

  async function fetchProfile(uid) {
    const snap = await getDoc(doc(db, "users", uid));
    profile.value = snap.exists() ? snap.data() : null;
  }

  async function initAuthListener() {
    await auth.authStateReady();

    user.value = auth.currentUser;
    if (user.value) {
      await fetchProfile(user.value.uid);
    } else {
      profile.value = null;
    }
    initialised.value = true;

    onAuthStateChanged(auth, async (firebaseUser) => {
      user.value = firebaseUser;
      if (firebaseUser) {
        await fetchProfile(firebaseUser.uid);
      } else {
        profile.value = null;
      }
    });
  }

  async function register({ displayName, email, password }) {
    loading.value = true;
    error.value = null;
    try {
      const cred = await createUserWithEmailAndPassword(auth, email, password);
      await updateProfile(cred.user, { displayName });

      const userDoc = {
        displayName,
        email,
        role: "user",
        createdAt: serverTimestamp(),
      };
      await setDoc(doc(db, "users", cred.user.uid), userDoc);

      user.value = cred.user;
      profile.value = userDoc;
      return cred.user;
    } catch (err) {
      error.value = mapAuthError(err.code);
      throw err;
    } finally {
      loading.value = false;
    }
  }

  async function login({ email, password }) {
    loading.value = true;
    error.value = null;
    try {
      const cred = await signInWithEmailAndPassword(auth, email, password);
      user.value = cred.user;
      await fetchProfile(cred.user.uid);
      return cred.user;
    } catch (err) {
      error.value = mapAuthError(err.code);
      throw err;
    } finally {
      loading.value = false;
    }
  }

  async function logout() {
    await signOut(auth);
    user.value = null;
    profile.value = null;
  }

  function mapAuthError(code) {
    const messages = {
      "auth/email-already-in-use":
        "An account already exists with this email address.",
      "auth/invalid-email": "Enter a valid email address.",
      "auth/weak-password": "Password should be at least 6 characters.",
      "auth/user-not-found": "No account found with this email address.",
      "auth/wrong-password": "Incorrect password. Please try again.",
      "auth/invalid-credential": "Incorrect email or password.",
      "auth/too-many-requests":
        "Too many attempts. Please wait a moment and try again.",
    };
    return messages[code] || "Something went wrong. Please try again.";
  }

  return {
    user,
    profile,
    initialised,
    loading,
    error,
    isAuthenticated,
    role,
    isAdmin,
    initAuthListener,
    register,
    login,
    logout,
  };
});
