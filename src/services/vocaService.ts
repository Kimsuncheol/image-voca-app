import { collection, addDoc, getDocs, query, where } from 'firebase/firestore';
import { db } from './firebase';

export const vocaService = {
  async addWord(userId: string, word: string, definition: string) {
    try {
      const docRef = await addDoc(collection(db, 'vocabulary'), {
        userId,
        word,
        definition,
        createdAt: new Date(),
      });
      return docRef.id;
    } catch (e) {
      console.error('Error adding document: ', e);
      throw e;
    }
  },

  async getUserWords(userId: string) {
    const q = query(collection(db, 'vocabulary'), where('userId', '==', userId));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  }
};
