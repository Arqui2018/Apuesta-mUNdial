import gql from 'graphql-tag';

// user_ms

export const CREATE_SESSION = gql`
  mutation createSession($user: UserIntput!) {
    createSession(user: $user) {
      authentication_token
      autentication
    }
  }
`;

export const SESSION_BY_TOKEN = gql`
  query sessionByToken($token: String!) {
    sessionByToken(token: $token) {
      id
      name
      email
      wallet_id
      autentication
    }
  }
`;

export const DESTROY_SESSION = gql`
  mutation destroySession($token: String!) {
    destroySession(token: $token) {
      id
      autentication
    }
  }
`;

// result_ms

export const RESULT_BY_USER = gql`
  query resultByUser($id: Int!) {
    resultByUser(id: $id) {
      amount
      date
      g_local
      g_visit
      winner
      match_id
      wallet_id
    }
  }
`;


// wallet_ms

export const WALLET_BY_ID = gql`
  query walletById($id: Int!) {
    walletById(id: $id) {
      balance
    }
  }
`;

// match_ms

export const TEAM_BY_ID = gql`
  query teamById($id: Int!) {
    teamById(id: $id) {
      id
      name
    }
  }
`;


export const MATCH_BY_ID = gql`
  query matchById($id: Int!) {
    matchById(id: $id) {
      id
      team_local_id
      team_visitor_id
      goals_local
      goals_visitor
      date
    }
  }
`;