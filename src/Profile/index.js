import React, { Component } from 'react';

import { Alert } from 'react-native';
import { Container, Content, H1 } from 'native-base';


import Header from '../components/header';
import Footer from '../components/footer';
import ListProfile from './listProfile';

import { userData, locale } from '../utilities';

export default class Profile extends Component {
  constructor(props) {
    super(props);
    this.state = {
      name: {
        value: 'Cargando ...',
        icon: 'contact',
      },
      email: {
        value: 'Cargando ...',
        icon: 'ios-mail',
      },
      wallet_id: {
        value: 'Cargando ...',
        icon: 'ios-card',
      },
      balance: {
        value: 'Cargando ...',
        icon: 'logo-usd',
      },
    };
  }

  async componentWillMount() {
    try {
      const data = await userData();
      if (data) {
        this.setState({
          name: { ...this.state.name, value: data.name },
          email: { ...this.state.email, value: data.email },
          wallet_id: { ...this.state.wallet_id, value: data.wallet_id },
          balance: { ...this.state.balance, value: locale(Number(data.balance)) },
        });
      }
    } catch (err) {
      Alert.alert(err);
    }
  }

  render() {
    return (
      <Container>
        <Header nameIcon="arrow-back" redirect={() => this.props.navigation.goBack()} />

        <Content padder>
          <H1 style={{ marginTop: 10, alignSelf: 'center' }}>Información personal</H1>
          <ListProfile data={this.state} />
        </Content>

        <Footer />

      </Container>
    );
  }
}
