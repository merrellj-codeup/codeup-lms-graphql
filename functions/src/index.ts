import {ExpressContext, gql} from "apollo-server-express";
import {ApolloServer,Config} from "apollo-server-cloud-functions";
import * as functions from "firebase-functions";
import * as admin from 'firebase-admin';
const { ApolloServerPluginLandingPageGraphQLPlayground } = require('apollo-server-core');

admin.initializeApp();

const db = admin.firestore();
db.settings({ ignoreUndefinedProperties: true });
const typeDefs = gql`
    type Query {
        users(query: String): [User!]
        cohorts(query: String): [Cohort!]
    }
    type User {
        uid: String
        first_name: String
        last_name: String
        email: String
        last_login: String
        token: String
        active_cohort: [Cohort]
    }
    type Cohort {
        name: String
        class_code: String
        classroom_id: String
        update_time: String
    }
`;

const resolvers = {
    Query: {
        users: (parent: any, args: any, ctx: any, info:any) => {
            //If an argument is not passed to the query
            if(!args.query) {
                return new Promise((resolve, reject) => {
                    fetchAllUsers((data: any) => {
                        resolve(data);
                    });
                });
            }
            //Typescript throws an error if a function path doesn't return a value, so this area below is for if we ever want to resolve query arguments
            else {
                return new Promise((resolve, reject) => {
                    fetchAllUsers((data: any) => {
                        resolve(data);
                    });
                });
            }
        },
        cohorts: () => {
            return new Promise((resolve, reject) => {
                fetchAllCohorts((data: any) => {
                    resolve(data);
                });
            });
        },
    },
    User: {
        active_cohort: (parent: any, args: any, ctx: any, info:any) => {
            let cohortID: string = parent.active_cohort;
            return new Promise((resolve, reject) => {
                fetchCohort((data: any) => {
                    resolve(data);
                }, cohortID);
            });
        },
    }
};

const fetchAllUsers = (callback: any) => {
    db.collection('users')
        .get()
        .then((item: any) => {
            const items: any = [];
            item.docs.forEach((item: { data: () => any; }) => {
                console.log('Adding...')
                items.push(item.data())
            });
            return callback(items);
        })
        .catch(e => console.log(e));
};
// const fetchUser = (callback: any, userID: string) => {
//     db.collection('users')
//         .where("uid", "==", userID)
//         .get()
//         .then((item: any) => {
//             const items: any = [];
//             item.docs.forEach((item: { data: () => any; }) => {
//                 console.log('Adding...')
//                 items.push(item.data())
//             });
//             return callback(items);
//         })
//         .catch(e => console.log(e));
// };

const fetchAllCohorts = (callback: any) => {
    db.collection('cohorts')
        .get()
        .then((item: any) => {
            const items: any = [];
            item.docs.forEach((item: { data: () => any; }) => {
                console.log('Adding...')
                items.push(item.data())
            });
            return callback(items);
        })
        .catch(e => console.log(e));
};
const fetchCohort = (callback: any, cohortID: string) => {
    db.collection('cohorts')
        .where("classroom_id", "==", cohortID)
        .get()
        .then((item: any) => {
            const items: any = [];
            item.docs.forEach((item: { data: () => any; }) => {
                console.log('Adding...')
                items.push(item.data())
            });
            return callback(items);
        })
        .catch(e => console.log(e));
};
  
const graphqlConfig: Config<ExpressContext> = {
    typeDefs,
    resolvers,
    introspection: true,
    plugins: [
        ApolloServerPluginLandingPageGraphQLPlayground({
          // options
        }),
    ],
  };
  const server = new ApolloServer(graphqlConfig);
  const handler = server.createHandler();
  // Have to cast to any as although the createHandler call will return a function with req, res args TS throws a wobbly
  exports.graphql = functions.https.onRequest(handler as any);