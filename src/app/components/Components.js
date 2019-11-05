import React from 'react';
import './Panel.css';
import Component from './Component';
import SmoothieComponent, { TimeSeries } from './SmoothieChart';
import {SectionHeader, Title, TitleGroup } from './StyledComponents';
import Checkbox from './Checkbox';
import isEqual from 'react-fast-compare';

export default class Components extends React.Component {

  constructor(props) {
    super(props);
    this.timeSeries = new TimeSeries({
      resetBounds: true,
      resetBoundsInterval: 3000
    });

    this.state = {
      linkMinMax: false,
      showPoolGraph: false
    };

    this.references = {};
  }

  getOrCreateRef(id) {
    if (!this.references.hasOwnProperty(id)) {
        this.references[id] = React.createRef();
    }
    return this.references[id];
  }

  showPoolGraphChanged = (e) => {
    this.setState({
      showPoolGraph: e.target.checked
    });
  }

  linkMinMaxChanged = (e) => {
    this.setState({
      linkMinMax: e.target.checked,
      chartRange: {
        min: 0,
        max: 0
      }
    });
  }

  componentWillReceiveProps() {
    if (this.state.linkMinMax)
    {
      let timeSeries = [];
      Object.values(this.references).forEach(e => timeSeries = timeSeries.concat(e.current.timeSeries));

      let minMax = timeSeries.reduce((acum, current) => ({
        min: Math.min(acum.min, current.minValue),
        max: Math.max(acum.max, current.maxValue)
      }),
        {
          min: Number.MAX_VALUE,
          max: Number.MIN_VALUE
        }
      );

      this.setState({chartRange: minMax});
    }
  }

  shouldComponentUpdate(nextProps, nextState) {
    return !isEqual(this.props, nextProps) ||
      !isEqual(this.state, nextState);
  }

  render() {
    const { components, componentsPools, showGraphs, overQueries } = this.props;

    if (!components) {
      return (
        <span>No components</span>
      );
    }

    const numComponents = components ? Object.keys(components).length : 0;
    const numComponentInstances = components && Object.values(components).length > 0 ? Object.values(components).reduce((a, c) => a + c) : undefined;

    let componentsHtml = Object.keys(components).map(name => {
      const highlighted = overQueries.find(e => e.components.included.indexOf(name) !== -1 ||
                          e.components.not.indexOf(name) !== -1)

      return <Component
        graphConfig={this.props.graphConfig.components}
        ref={this.getOrCreateRef(name)}
        showPoolGraph={this.state.showPoolGraph}
        linkMinMax={this.state.linkMinMax}
        key={name}
        name={name}
        value={components[name]}
        showGraphs={showGraphs}
        chartRange={this.state.chartRange}
        highlighted={highlighted}
        pool={componentsPools[name]}
      />;
    });
    this.timeSeries.append(new Date().getTime(), numComponentInstances);

    return (
      <div>
        <SectionHeader>
          <TitleGroup>
            <Title>COMPONENTS ({numComponents})</Title> <Title>{numComponentInstances} instances</Title>
          </TitleGroup>

          { showGraphs &&
            <Checkbox
              checked={this.state.linkMinMax}
              value={this.state.linkMinMax}
              description="Link mix/max graphs"
              onChange={this.linkMinMaxChanged}/>
          }
          { showGraphs &&
            <Checkbox
              checked={this.state.showPoolGraph}
              value={this.state.showPoolGraph}
              description="Show pool graph"
              onChange={this.showPoolGraphChanged}/>
          }
          {
            showGraphs &&
            <SmoothieComponent
            responsive
            millisPerPixel={60}
            grid={{
              fillStyle: 'transparent',
              strokeStyle: 'transparent'
            }}
            labels={{
              fillStyle: '#FFD29C',
              precision: 0
            }}
            height={30}
            series={[
              {
                data: this.timeSeries,
                strokeStyle: '#EB932C',
                fillStyle: 'rgba(255, 210, 156, 0.05)',
                lineWidth: 1,
              }
            ]}/>
          }
        </SectionHeader>
        <ul>
          {componentsHtml}
        </ul>
      </div>
    );
  }
}
