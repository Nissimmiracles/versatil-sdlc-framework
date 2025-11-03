/**
 * VERSATIL SDLC Framework - Marcus-Rails Sub-Agent Tests
 * Priority 3: Language Sub-Agent Testing
 *
 * Test Coverage:
 * - Ruby 3+ and Rails 7+ patterns
 * - ActiveRecord best practices
 * - Controller patterns (RESTful design)
 * - Security (OWASP, Rails security)
 * - Performance optimization (N+1 queries, caching)
 * - Testing patterns (RSpec, Minitest)
 * - Ruby idioms and conventions
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { MarcusRails } from './marcus-rails.js';
import type { AgentActivationContext } from '../../../core/base-agent.js';

// Mock dependencies
vi.mock('../../../../rag/enhanced-vector-memory-store.js', () => ({
  EnhancedVectorMemoryStore: vi.fn()
}));

describe('MarcusRails', () => {
  let agent: MarcusRails;

  beforeEach(() => {
    vi.clearAllMocks();
    agent = new MarcusRails();
  });

  describe('Agent Initialization', () => {
    it('should initialize with Rails specialization', () => {
      expect(agent.name).toBe('Marcus-Rails');
      expect(agent.id).toBe('marcus-rails');
      expect(agent.specialization).toContain('Rails');
    });

    it('should have Rails-specific system prompt', () => {
      expect(agent.systemPrompt).toContain('ActiveRecord');
      expect(agent.systemPrompt).toContain('Ruby');
    });
  });

  describe('ActiveRecord Pattern Detection', () => {
    it('should detect ActiveRecord models', () => {
      const content = `
        class User < ApplicationRecord
          has_many :posts
          validates :email, presence: true
        end
      `;

      const hasActiveRecordModel = agent['hasActiveRecordModel'](content);
      expect(hasActiveRecordModel).toBe(true);
    });

    it('should detect associations', () => {
      const content = `
        has_many :posts
        belongs_to :user
        has_one :profile
      `;

      const hasAssociations = agent['hasAssociations'](content);
      expect(hasAssociations).toBe(true);
    });

    it('should detect validations', () => {
      const content = `
        validates :email, presence: true, uniqueness: true
        validates :age, numericality: { greater_than: 0 }
      `;

      const hasValidations = agent['hasValidations'](content);
      expect(hasValidations).toBe(true);
    });

    it('should detect N+1 query problems', () => {
      const content = `
        users = User.all
        users.each do |user|
          puts user.posts.count # N+1 query!
        end
      `;

      const hasNPlusOne = agent['hasNPlusOne'](content);
      expect(hasNPlusOne).toBe(true);
    });

    it('should detect includes for eager loading', () => {
      const content = `
        users = User.includes(:posts, :comments).all
      `;

      const hasIncludes = agent['hasIncludes'](content);
      expect(hasIncludes).toBe(true);
    });

    it('should detect proper scopes', () => {
      const content = `
        scope :active, -> { where(active: true) }
        scope :recent, -> { order(created_at: :desc) }
      `;

      const hasScopes = agent['hasScopes'](content);
      expect(hasScopes).toBe(true);
    });
  });

  describe('Controller Pattern Detection', () => {
    it('should detect Rails controllers', () => {
      const content = `
        class UsersController < ApplicationController
          def index
            @users = User.all
          end
        end
      `;

      const hasController = agent['hasController'](content);
      expect(hasController).toBe(true);
    });

    it('should detect RESTful actions', async () => {
      const context: AgentActivationContext = {
        trigger: 'file-edit',
        content: `
          def index
            @users = User.all
          end

          def show
            @user = User.find(params[:id])
          end

          def create
            @user = User.new(user_params)
            @user.save
          end
        `,
        filePath: 'users_controller.rb'
      };

      const analysis = await agent['analyzeRailsPatterns'](context);
      expect(analysis.score).toBeGreaterThan(0);
    });

    it('should detect before_action filters', () => {
      const content = `
        before_action :authenticate_user!
        before_action :set_user, only: [:show, :edit, :update]
      `;

      const hasBeforeAction = agent['hasBeforeAction'](content);
      expect(hasBeforeAction).toBe(true);
    });

    it('should detect strong parameters', () => {
      const content = `
        def user_params
          params.require(:user).permit(:name, :email)
        end
      `;

      const hasStrongParams = agent['hasStrongParams'](content);
      expect(hasStrongParams).toBe(true);
    });

    it('should detect missing strong parameters', () => {
      const content = `
        def create
          @user = User.new(params[:user]) # Mass assignment vulnerability!
        end
      `;

      const hasMissingStrongParams = agent['hasMissingStrongParams'](content);
      expect(hasMissingStrongParams).toBe(true);
    });
  });

  describe('Security Pattern Detection', () => {
    it('should detect SQL injection vulnerability', () => {
      const content = `
        User.where("name = '#{params[:name]}'") # SQL injection!
      `;

      const hasSQLInjection = agent['detectSQLInjection'](content);
      expect(hasSQLInjection).toBe(true);
    });

    it('should detect parameterized queries', () => {
      const content = `
        User.where("name = ?", params[:name])
      `;

      const hasParameterized = agent['hasParameterizedQuery'](content);
      expect(hasParameterized).toBe(true);
    });

    it('should detect CSRF protection', () => {
      const content = `
        protect_from_forgery with: :exception
      `;

      const hasCSRFProtection = agent['hasCSRFProtection'](content);
      expect(hasCSRFProtection).toBe(true);
    });

    it('should detect authentication checks', () => {
      const content = `
        before_action :authenticate_user!
      `;

      const hasAuthentication = agent['hasAuthentication'](content);
      expect(hasAuthentication).toBe(true);
    });

    it('should detect authorization with Pundit', () => {
      const content = `
        authorize @post
        policy_scope(Post)
      `;

      const hasPundit = agent['hasPundit'](content);
      expect(hasPundit).toBe(true);
    });

    it('should detect exposed secrets', () => {
      const content = `
        api_key = "sk_live_12345abcde"
        password = "hardcoded_password"
      `;

      const hasExposedSecrets = agent['hasExposedSecrets'](content);
      expect(hasExposedSecrets).toBe(true);
    });
  });

  describe('Ruby 3+ Features', () => {
    it('should detect pattern matching', () => {
      const content = `
        case user
        in { name:, age: 18.. }
          puts "Adult: #{name}"
        end
      `;

      const hasPatternMatching = agent['hasPatternMatching'](content);
      expect(hasPatternMatching).toBe(true);
    });

    it('should detect endless methods', () => {
      const content = `
        def square(x) = x * x
      `;

      const hasEndlessMethod = agent['hasEndlessMethod'](content);
      expect(hasEndlessMethod).toBe(true);
    });

    it('should detect keyword arguments', () => {
      const content = `
        def create_user(name:, email:, age: 18)
          User.create(name: name, email: email, age: age)
        end
      `;

      const hasKeywordArgs = agent['hasKeywordArgs'](content);
      expect(hasKeywordArgs).toBe(true);
    });

    it('should detect safe navigation operator', () => {
      const content = `
        user&.posts&.first&.title
      `;

      const hasSafeNavigation = agent['hasSafeNavigation'](content);
      expect(hasSafeNavigation).toBe(true);
    });
  });

  describe('Performance Optimization', () => {
    it('should detect counter caches', () => {
      const content = `
        belongs_to :user, counter_cache: true
      `;

      const hasCounterCache = agent['hasCounterCache'](content);
      expect(hasCounterCache).toBe(true);
    });

    it('should detect caching', () => {
      const content = `
        Rails.cache.fetch("users-#{id}", expires_in: 12.hours) do
          User.find(id)
        end
      `;

      const hasCaching = agent['hasCaching'](content);
      expect(hasCaching).toBe(true);
    });

    it('should detect fragment caching', () => {
      const content = `
        <% cache @post do %>
          <%= render @post %>
        <% end %>
      `;

      const hasFragmentCache = agent['hasFragmentCache'](content);
      expect(hasFragmentCache).toBe(true);
    });

    it('should detect select for optimization', () => {
      const content = `
        User.select(:id, :name, :email).all
      `;

      const hasSelect = agent['hasSelect'](content);
      expect(hasSelect).toBe(true);
    });

    it('should detect pluck for arrays', () => {
      const content = `
        User.pluck(:email)
      `;

      const hasPluck = agent['hasPluck'](content);
      expect(hasPluck).toBe(true);
    });

    it('should detect find_each for batching', () => {
      const content = `
        User.find_each(batch_size: 1000) do |user|
          user.send_email
        end
      `;

      const hasFindEach = agent['hasFindEach'](content);
      expect(hasFindEach).toBe(true);
    });
  });

  describe('Background Jobs', () => {
    it('should detect ActiveJob', () => {
      const content = `
        class EmailJob < ApplicationJob
          def perform(user)
            UserMailer.welcome(user).deliver_now
          end
        end
      `;

      const hasActiveJob = agent['hasActiveJob'](content);
      expect(hasActiveJob).toBe(true);
    });

    it('should detect Sidekiq', () => {
      const content = `
        class EmailWorker
          include Sidekiq::Worker
          def perform(user_id)
            # work
          end
        end
      `;

      const hasSidekiq = agent['hasSidekiq'](content);
      expect(hasSidekiq).toBe(true);
    });

    it('should recommend background jobs for heavy work', async () => {
      const context: AgentActivationContext = {
        trigger: 'file-edit',
        content: `
          def create
            @user = User.create(user_params)
            UserMailer.welcome(@user).deliver_now # Should be async!
          end
        `,
        filePath: 'users_controller.rb'
      };

      const analysis = await agent['analyzeRailsPatterns'](context);
      expect(analysis).toBeDefined();
    });
  });

  describe('Testing Patterns', () => {
    it('should detect RSpec tests', () => {
      const content = `
        RSpec.describe User, type: :model do
          it "validates email presence" do
            user = User.new(email: nil)
            expect(user).not_to be_valid
          end
        end
      `;

      const hasRSpec = agent['hasRSpec'](content);
      expect(hasRSpec).toBe(true);
    });

    it('should detect Minitest', () => {
      const content = `
        class UserTest < ActiveSupport::TestCase
          test "validates email presence" do
            user = User.new(email: nil)
            assert_not user.valid?
          end
        end
      `;

      const hasMinitest = agent['hasMinitest'](content);
      expect(hasMinitest).toBe(true);
    });

    it('should detect FactoryBot', () => {
      const content = `
        FactoryBot.define do
          factory :user do
            name { "John Doe" }
            email { "john@example.com" }
          end
        end
      `;

      const hasFactoryBot = agent['hasFactoryBot'](content);
      expect(hasFactoryBot).toBe(true);
    });

    it('should detect fixtures', () => {
      const content = `
        john:
          name: John Doe
          email: john@example.com
      `;
      const filePath = 'test/fixtures/users.yml';

      const hasFixtures = agent['hasFixtures'](content, filePath);
      expect(hasFixtures).toBe(true);
    });

    it('should validate proper test structure', async () => {
      const context: AgentActivationContext = {
        trigger: 'file-edit',
        content: `
          RSpec.describe User do
            describe "#full_name" do
              it "returns first and last name" do
                user = User.new(first_name: "John", last_name: "Doe")
                expect(user.full_name).to eq("John Doe")
              end
            end
          end
        `,
        filePath: 'spec/models/user_spec.rb'
      };

      const analysis = await agent['analyzeRailsPatterns'](context);
      expect(analysis.score).toBeGreaterThan(0);
    });
  });

  describe('Ruby Idioms', () => {
    it('should detect blocks and yields', () => {
      const content = `
        def with_logging
          puts "Starting"
          yield
          puts "Done"
        end
      `;

      const hasBlocks = agent['hasBlocks'](content);
      expect(hasBlocks).toBe(true);
    });

    it('should detect symbols', () => {
      const content = `
        User.where(active: true).order(:created_at)
      `;

      const hasSymbols = agent['hasSymbols'](content);
      expect(hasSymbols).toBe(true);
    });

    it('should detect string interpolation', () => {
      const content = `
        puts "Hello, #{name}!"
      `;

      const hasStringInterpolation = agent['hasStringInterpolation'](content);
      expect(hasStringInterpolation).toBe(true);
    });

    it('should detect proper naming conventions', async () => {
      const context: AgentActivationContext = {
        trigger: 'file-edit',
        content: `
          class UserController < ApplicationController
            def show
              @user = User.find(params[:id])
            end
          end
        `,
        filePath: 'user_controller.rb'
      };

      const analysis = await agent['analyzeRailsPatterns'](context);
      expect(analysis).toBeDefined();
    });
  });

  describe('Migration Patterns', () => {
    it('should detect migrations', () => {
      const content = `
        class CreateUsers < ActiveRecord::Migration[7.0]
          def change
            create_table :users do |t|
              t.string :name
              t.string :email
              t.timestamps
            end
          end
        end
      `;

      const hasMigration = agent['hasMigration'](content);
      expect(hasMigration).toBe(true);
    });

    it('should detect indexes', () => {
      const content = `
        add_index :users, :email, unique: true
      `;

      const hasIndex = agent['hasIndex'](content);
      expect(hasIndex).toBe(true);
    });

    it('should detect foreign keys', () => {
      const content = `
        add_foreign_key :posts, :users
      `;

      const hasForeignKey = agent['hasForeignKey'](content);
      expect(hasForeignKey).toBe(true);
    });

    it('should validate proper migration structure', async () => {
      const context: AgentActivationContext = {
        trigger: 'file-edit',
        content: `
          class AddIndexToUsersEmail < ActiveRecord::Migration[7.0]
            def change
              add_index :users, :email, unique: true
            end
          end
        `,
        filePath: 'db/migrate/20250103_add_index_to_users_email.rb'
      };

      const analysis = await agent['analyzeRailsPatterns'](context);
      expect(analysis.score).toBeGreaterThan(0);
    });
  });

  describe('Activation Response', () => {
    it('should activate and provide Rails-specific analysis', async () => {
      const context: AgentActivationContext = {
        trigger: 'file-edit',
        content: `
          class UsersController < ApplicationController
            before_action :authenticate_user!
            before_action :set_user, only: [:show, :update, :destroy]

            def index
              @users = User.includes(:posts).active.recent
              render json: @users
            end

            private

            def set_user
              @user = User.find(params[:id])
            end

            def user_params
              params.require(:user).permit(:name, :email)
            end
          end
        `,
        filePath: 'users_controller.rb'
      };

      const response = await agent.activate(context);

      expect(response).toHaveProperty('success');
      expect(response).toHaveProperty('suggestions');
    });

    it('should provide Rails best practices', async () => {
      const context: AgentActivationContext = {
        trigger: 'file-edit',
        content: `
          class UsersController < ApplicationController
            def index
              @users = User.all
              @users.each do |user|
                puts user.posts.count
              end
            end
          end
        `,
        filePath: 'users_controller.rb'
      };

      const response = await agent.activate(context);

      expect(response.suggestions).toBeDefined();
      expect(response.suggestions!.length).toBeGreaterThan(0);
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty content', async () => {
      const context: AgentActivationContext = {
        trigger: 'file-edit',
        content: '',
        filePath: 'empty.rb'
      };

      const analysis = await agent['analyzeRailsPatterns'](context);

      expect(analysis).toBeDefined();
      expect(analysis.score).toBeGreaterThanOrEqual(0);
    });

    it('should handle non-Rails content gracefully', async () => {
      const context: AgentActivationContext = {
        trigger: 'file-edit',
        content: 'const x = 1;',
        filePath: 'utils.js'
      };

      const analysis = await agent['analyzeRailsPatterns'](context);

      expect(analysis).toBeDefined();
    });
  });
});
