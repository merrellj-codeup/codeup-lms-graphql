import {ExpressContext, gql} from "apollo-server-express";
import {ApolloServer,Config} from "apollo-server-cloud-functions";
import * as functions from "firebase-functions";
import * as admin from 'firebase-admin';
const { ApolloServerPluginLandingPageGraphQLPlayground } = require('apollo-server-core');

admin.initializeApp();

const db = admin.firestore();
const typeDefs = gql`
    type Query {
        users(query: string): [User!]
        cohorts(query: string): [Cohort!]
    }
    type User {
        uid: String
        first_name: String
        last_name: String
        email: String
        last_login: String
        token: String
        active_cohort: String
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
        users: () => {
            return new Promise((resolve, reject) => {
                fetchAllUsers((data: any) => {
                    resolve(data);
                });
            });
        },
        cohorts: () => {
            return new Promise((resolve, reject) => {
                fetchAllCohorts((data: any) => {
                    resolve(data);
                });
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
  
const graphqlConfig: Config<ExpressContext> = {
    typeDefs,
    resolvers,
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