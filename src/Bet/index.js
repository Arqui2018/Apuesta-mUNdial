import React, { Component } from 'react';
import { Container, Content, Form, H1, Text, Button, Item, Input, View } from 'native-base';
import Slider from 'react-native-slider';
import { Col, Grid } from 'react-native-easy-grid';
import { Alert } from 'react-native';

import { locale, nameTeam, userData } from '../utilities';
import styles from '../assets/css/index';

import Header from '../components/header';
import Footer from '../components/footer';

import { clientRequest } from '../../App';
import { RESULT_BY_MATCH, CREATE_RESULT, UPDATE_WALLET, MATCH_BY_ID, UPDATE_RESULT } from '../queries';


export default class Bet extends Component {
  constructor(props) {
    super(props);
    this.state = {
      activity: 'Apostar',
      match: {},
      matchLocal: 'Cargando...',
      matchVisitor: 'Cargando...',
      allResults: [],
      goalsLocal: '',
      goalsVisitor: '',
      amount: 10000,
      well: '0',
      bets: 0,
      toWin: '0',
      results: 0,
    };

    this.changeValue = this.changeValue.bind(this);
    this.makeAction = this.makeAction.bind(this);
    this.calculateStadistics = this.calculateStadistics.bind(this);
    this.createResult = this.createResult.bind(this);
    this.updateResult = this.updateResult.bind(this);
  }

  async componentWillMount() {
    const { params } = this.props.navigation.state;

    if (!Object.prototype.hasOwnProperty.call(params, 'day')) {
      await this.setState({ activity: 'Actualizar' });

    }

    if (Object.prototype.hasOwnProperty.call(params, 'result')) {
      this.setState({
        amount: params.result.amount,
        goalsLocal: String(params.result.g_local),
        goalsVisitor: String(params.result.g_visit),
      });
      const { matchById } = await clientRequest.request(MATCH_BY_ID, { id: params.result.match_id });
      params.match = matchById;
    }

    if (Object.prototype.hasOwnProperty.call(params, 'match')) {
      this.setState({ match: params.match });
      nameTeam(params.match.team_local_id).then(matchLocal => this.setState({ matchLocal }));
      nameTeam(params.match.team_visitor_id).then(matchVisitor => this.setState({ matchVisitor }));
    }

    try {
      const { resultByMatch } = await clientRequest.request(RESULT_BY_MATCH, { id: params.match.id });
      this.setState({ allResults: resultByMatch });
    } catch (err) {
      Alert.alert(err);
    }

    if (this.state.activity === 'Actualizar') {
      this.calculateStadistics();
    }
  }

  async changeValue(key, value) {
    await this.setState({ [key]: value });
    this.calculateStadistics();
  }

  calculateStadistics() {
    if (this.state.goalsLocal && this.state.goalsVisitor) {
      let count = 0;
      const betWithMatch = this.state.allResults.length;
      let pool = 0;
      let sum = parseInt(this.state.amount, 10);
      const goalsLocal = parseInt(this.state.goalsLocal, 10);
      const goalsVisitor = parseInt(this.state.goalsVisitor, 10);
      const amount = parseInt(this.state.amount, 10);

      console.log(betWithMatch);
      this.state.allResults.forEach((bet) => {
        if (bet.g_local === goalsLocal && bet.g_visit === goalsVisitor) {
          sum += bet.amount;
          count++;
        } else {
          pool += bet.amount;
        }
      });

      const commission = amount / sum;
      const ourWell = (sum + pool) * 0.9;
      pool *= 0.9; // 10% to the house
      const toWin = parseInt((pool * commission) + parseInt(this.state.amount * 0.9, 10), 10);
      this.setState({
        well: ourWell,
        results: count,
        bets: betWithMatch,
        toWin,
      });
    }
  }

  async makeAction() {
    if (this.state.goalsLocal.length && this.state.goalsVisitor.length) {
      if (this.state.activity === 'Apostar') {
        Alert.alert(
          '¿Esta seguro que sea apostar a este partido?',
          `El valor de la apuesta es de ${locale(this.state.amount)}`,
          [
            { text: 'Cancelar', onPress: () => {}, style: 'cancel' },
            { text: 'Aceptar', onPress: () => this.createResult() },
            { cancelable: false },
          ],
        );
      } else { // updateBet
        Alert.alert(
          '¿Esta seguro que sea apostar editar este partido?',
          `El valor de la apuesta es de ${locale(this.state.amount)}`,
          [
            { text: 'Cancelar', onPress: () => {}, style: 'cancel' },
            { text: 'Aceptar', onPress: () => this.updateResult() },
            { cancelable: false },
          ],
        );
      }
    } else {
      Alert.alert('Por favor ingrese el marcador');
    }
  }

  async updateResult() {
    try {
      const user = await userData();
      const result = {
        user_id: parseInt(user.id, 10),
        amount: parseInt(this.state.amount, 10),
        g_local: parseInt(this.state.goalsLocal, 10),
        g_visit: parseInt(this.state.goalsVisitor, 10),
        match_id: parseInt(this.state.match.id, 10),
        wallet_id: parseInt(user.wallet_id, 10),
      };

      const { params } = this.props.navigation.state;
      const originalAmount = params.result.amount;
      const { id } = params.result;

      const dataResult = clientRequest.request(UPDATE_RESULT, { id, result });
      const dataWallet = clientRequest.request(
        UPDATE_WALLET,
        { id: user.id, wallet: { balance: originalAmount - result.amount } },
      );
      await Promise.all([dataResult, dataWallet]);
      Alert.alert('Felicitaciones', 'Apuesta ha sido editada Exitosamente');
      this.props.navigation.navigate('MyBets'); // return mybets
    } catch (err) {
      console.log(JSON.stringify(err));
      Alert.alert(JSON.stringify(err));
    }
  }

  async createResult() {
    try {
      const user = await userData();
      const result = {
        user_id: parseInt(user.id, 10),
        amount: parseInt(this.state.amount, 10),
        g_local: parseInt(this.state.goalsLocal, 10),
        g_visit: parseInt(this.state.goalsVisitor, 10),
        match_id: parseInt(this.state.match.id, 10),
        wallet_id: parseInt(user.wallet_id, 10),
      };

      const dataResult = clientRequest.request(CREATE_RESULT, { result });
      const dataWallet = clientRequest.request(
        UPDATE_WALLET,
        { id: user.id, wallet: { balance: -result.amount } }, // calc diference
      );
      await Promise.all([dataResult, dataWallet]);
      Alert.alert('Felicitaciones', 'Apuesta creata Exitosamente');
      this.props.navigation.navigate('Home'); // return home
    } catch (err) {
      Alert.alert(String(err));
    }
  }


  render() {
    return (
      <Container>
        <Header nameIcon="arrow-back" redirect={() => this.props.navigation.navigate('Home')} />

        <Content>

          <H1 style={{ marginTop: 10, alignSelf: 'center' }}>Hora de Apostar!!!</H1>

          <Form>
            <Grid>
              <Col style={{ marginTop: 15, height: 90 }}>
                <Text style={{ alignSelf: 'center' }}>
                  {this.state.matchLocal}
                </Text>
                <Item rounded style={{ alignSelf: 'center' }}>
                  <Input
                    textAlign="center"
                    keyboardType="numeric"
                    value={this.state.goalsLocal}
                    onChangeText={value => this.changeValue('goalsLocal', value)}
                  />
                </Item>
              </Col>

              <Col style={{ marginTop: 15, height: 90 }}>
                <Text style={{ alignSelf: 'center' }}>
                  {this.state.matchVisitor}
                </Text>
                <Item rounded style={{ alignSelf: 'center' }}>
                  <Input
                    textAlign="center"
                    keyboardType="numeric"
                    value={this.state.goalsVisitor}
                    onChangeText={value => this.changeValue('goalsVisitor', value)}
                  />
                </Item>
              </Col>
            </Grid>
            <Grid>
              <Col>
                <View style={styles.bet}>
                  <Text style={{ alignSelf: 'center' }}>Cantidad de Apuesta</Text>
                  <Slider
                    value={this.state.amount}
                    onValueChange={value => this.changeValue('amount', value)}
                    minimumValue={10000}
                    maximumValue={2000000}
                    step={10000}
                  />
                  <Text style={{ alignSelf: 'center' }}>{`$${locale(this.state.amount)}`}</Text>
                </View>
              </Col>
            </Grid>


            <Grid>
              <Col style={{ marginTop: 23 }}>
                <Text style={{ alignSelf: 'center' }}>Pozo</Text>
                <Item rounded>
                  <Input disabled textAlign="center" value={locale(parseInt(this.state.well, 10))} />
                </Item>

                <Text style={{ alignSelf: 'center' }}>Numero de Apuestas</Text>
                <Item rounded>
                  <Input disabled textAlign="center" value={String(this.state.bets)} />
                </Item>
              </Col>

              <Col style={{ marginTop: 23 }}>
                <Text style={{ alignSelf: 'center' }}>Posible Ganancia</Text>
                <Item rounded>
                  <Input disabled textAlign="center" value={locale(parseInt(this.state.toWin, 10))} />
                </Item>

                <Text style={{ alignSelf: 'center' }}>Mismo marcador</Text>
                <Item rounded>
                  <Input disabled textAlign="center" value={String(this.state.results)} />
                </Item>
              </Col>
            </Grid>
            <Button onPress={() => this.makeAction()} rounded danger style={{ marginTop: 25, alignSelf: 'center' }}>
              <Text>{this.state.activity}</Text>
            </Button>
          </Form>

        </Content>

        <Footer />
      </Container>
    );
  }
}