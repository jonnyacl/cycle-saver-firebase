import * as fStore from "@google-cloud/firestore";
import config from "./config";

const PROJECTID = config.projectId;
const firestore = new fStore.Firestore({
  projectId: PROJECTID,
  timestampsInSnapshots: true,
});

export const storeUserData = async (tableName: string, userId: string, data: any): Promise<fStore.DocumentReference> => {
    console.log(`Storing ${JSON.stringify(data)} into ${tableName} for user ${userId}`);
    const collection = firestore.collection(tableName);
    data.userId = userId;
    return collection.add(data);
};

export const getUserData = (tableName: string, userId: string): Promise<any> => {
    return new Promise((resolve, reject) => {
        const collection = firestore.collection(tableName);
        console.log(`Fetching ${tableName} for user ${userId}`);
        collection.where('userId', '==', userId).get().then(snapshot => {
            if (snapshot.empty) {
                console.log(`Unable to find the document ${userId} from ${tableName}`);
                reject({ status: 404, error: `Unable to find the document ${userId} from ${tableName}` });
            } else {
                const userData: fStore.DocumentData[] = [];
                snapshot.forEach(s => {
                    userData.push(s.data());
                });
                resolve(userData);
            }
        }).catch(e => {
            console.error(e);
            reject({ status: 404, error: `Unable to retrieve the document ${userId} from ${tableName}`});
        })
    });
};

export const storeStravaToken = async (userId: string, token: any): Promise<fStore.WriteResult> => {
    console.log(`Storing ${JSON.stringify(token)} into stravatokens for user ${userId}`);
    const collection = firestore.collection('stravatokens');
    return collection.doc(userId).set(token);
};
